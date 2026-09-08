import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "../api/axios";

function DepartamentoTabla() {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState(null);

  const [formNombre, setFormNombre] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState(null);

  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [coordinadorId, setCoordinadorId] = useState("");

  const coordinadorSeleccionado = usuariosDisponibles.find((u) => u.Id_usuario === coordinadorId);

  useEffect(() => {
    api.get('/departamento')
      .then((res) => {
        const data = res.data;

        if (Array.isArray(data)) {
          setDatos(data);
        } else if (data.data && Array.isArray(data.data)) {
          setDatos(data.data);
        } else {
          setDatos([]);
        }
      })
      .catch((err) => {
        if (err.response && err.response.status === 401) {
          setError("Sesión expirada. Por favor, inicia sesión nuevamente.");
        } else {
          setError("Error al cargar los departamentos. Por favor, intenta nuevamente.");
        }
      })
      .finally(() => {
        setCargando(false);
      });
  }, []);

const handleGuardarCambios = () => {
  setGuardando(true);
  setErrorGuardar(null);

  const id = departamentoSeleccionado.Id_departamento;

  Promise.all([
    api.put(`/departamento/${id}`, { Nombre: formNombre }),
    api.patch(`/departamento/${id}/coordinador`, { idCoordinador: coordinadorId }),
  ])
    .then(() => {
      setDatos((prevDatos) =>
        prevDatos.map((d) =>
          d.Id_departamento === id
            ? {
                ...d,
                Nombre: formNombre,
                coordinador: usuariosDisponibles.find((u) => u.Id_usuario === coordinadorId) || null,
              }
            : d
        )
      );
      setModalAbierto(false);
    })
    .catch(() => {
      setErrorGuardar("No se pudo guardar el cambio. Intenta nuevamente.");
    })
    .finally(() => {
      setGuardando(false);
    });
};

useEffect(() => {
  api.get('/users')
  .then((res) => {
    const data = res.data;
    setUsuariosDisponibles(Array.isArray(data)? data : data.data || []);
  })
  .catch(() => {
    setUsuariosDisponibles([]);
  });
}, []);

  const handleAbrirModal = (departamento) => {
    setDepartamentoSeleccionado(departamento);
    setFormNombre(departamento.Nombre || departamento.nombre || "");
    setCoordinadorId(departamento.coordinador?.Id_usuario ? String(departamentoSeleccionado.coordinado.Id_usuario) : "");
    setErrorGuardar(null);
    setModalAbierto(true);
  };

  if (cargando) return <p className="p-6 text-center text-muted-foreground">Cargando departamentos...</p>;
  if (error) return <p className="p-6 text-center text-red-500">Error: {error}</p>;

  return (
    <>
    <div className="p-6 max-w-5xl mx-auto pt-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Gestión de Departamentos</h2>
      </div>

      <div className="flex gap-2 justify-between items-center mb-4">
        <div className="flex gap-1 items-center">
          <Input type="search" placeholder="Buscar departamento..." className="h-9 w-64" />
          <Button className="h-9 bg-black text-white rounded-md transition-transform duration-200 hover:scale-105 hover:bg-black/90">
            Buscar
          </Button>
        </div>
        <div className="flex gap-2 items-center">
          <HoverCard>
            <HoverCardTrigger asChild>
              <button className="flex items-center justify-center rounded-full p-2 shadow-md transition-all duration-200 hover:scale-110 hover:bg-neutral-200 active:scale-95 text-neutral-700 dark:text-neutral-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-circle-plus">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
                  <path d="M9 12h6" />
                  <path d="M12 9v6" />
                </svg>
              </button>
            </HoverCardTrigger>

            <HoverCardContent className="w-64 p-3 bg-white dark:bg-slate-900 border shadow-md rounded-md">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Agregar Departamento</h4>
                <p className="text-xs text-muted-foreground">
                  Crea un nuevo registro de departamento asignándole un coordinador.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Nombre del Departamento</TableHead>
              <TableHead>Coordinador</TableHead>
              <TableHead>Colaboradores</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-center" colSpan={2}>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {datos.length > 0 ? (
              datos.map((departamento, index) => (
                <TableRow
                  key={index}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleAbrirModal(departamento)}
                >
                  <TableCell className="font-medium">
                    {departamento.Id_departamento || departamento.idDepartamento || departamento.id}
                  </TableCell>
                  <TableCell>{departamento.Nombre || departamento.nombre}</TableCell>

                  <TableCell>
                    {departamento.coordinador ? (
                      `${departamento.coordinador.Nombre || departamento.coordinador.nombre} ${departamento.coordinador.APaterno || departamento.coordinador.aPaterno} ${departamento.coordinador.AMaterno || departamento.coordinador.aMaterno}`
                    ) : (
                      <span className="text-muted-foreground italic">Sin asignar</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {departamento.usuarios?.length > 0 ? (
                    <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-0.5 text-xs font-medium">
                    {departamento.usuarios.length} colaborador{departamento.usuarios.length !== 1 ? "es" : ""}
                  </span>
                  ) : (
                    <span className="text-muted-foreground italic">Sin asignar</span>
                  )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      departamento.Activo || departamento.activo
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {departamento.Activo || departamento.activo ? "Activo" : "Inactivo"}
                    </span>
                  </TableCell>

                  <TableCell className="text-center">
                    <button
                      className="inline-flex items-center justify-center rounded-full p-2 text-muted-foreground transition-all duration-200 hover:scale-110 hover:bg-neutral-200 hover:text-black dark:hover:bg-slate-800 dark:hover:text-white active:scale-95"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Acción de editar
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-pencil">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" />
                        <path d="M13.5 6.5l4 4" />
                      </svg>
                    </button>
                  </TableCell>

                  <TableCell className="text-center">
                    <button
                      className="inline-flex items-center justify-center rounded-full p-2 text-red-500 transition-all duration-200 hover:scale-110 hover:bg-red-50 dark:hover:bg-red-950/30 active:scale-95"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Acción de eliminar
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-trash-x">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M4 7h16" />
                        <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                        <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                        <path d="M10 12l4 4m0 -4l-4 4" />
                      </svg>
                    </button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No se encontraron departamentos registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
    {/* ================= PANTALLA EMERGENTE (MODAL) ================= */}
<Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
  <DialogContent className="sm:max-w-[600px] bg-white dark:bg-slate-900">
    <DialogHeader>
      <DialogTitle>
        {departamentoSeleccionado ? "Detalles del Departamento" : "Nuevo Departamento"}
      </DialogTitle>
      <DialogDescription>
        {departamentoSeleccionado
          ? "Visualiza los detalles del departamento seleccionado y sus colaboradores."
          : "Ingresa los datos para registrar un nuevo departamento."}
      </DialogDescription>
    </DialogHeader>

    {/* Formulario dentro del Modal */}
    <div className="grid gap-5 py-4">
      <div className="grid gap-2">
        <label htmlFor="nombre" className="text-sm font-medium">
          Nombre del Departamento
        </label>
        <Input
          id="nombre"
          value={formNombre}
          onChange={(e) => setFormNombre(e.target.value)}
          placeholder="Ej. Recursos Humanos"
        />
      </div>

      <div className="grid gap-2">
  <label className="text-sm font-medium">Coordinador</label>
  <label className="text-xs text-muted-foreground"> coordinador actual: {departamentoSeleccionado?.coordinador ? `${departamentoSeleccionado.coordinador.Nombre} ${departamentoSeleccionado.coordinador.APaterno} ${departamentoSeleccionado.coordinador.AMaterno}` : "Sin asignar"}</label>
<Select
  value={coordinadorId ? String(coordinadorId) : undefined}
  onValueChange={(val) => setCoordinadorId(Number(val))}
>
  <SelectTrigger className="bg-white dark:bg-slate-950">
    <SelectValue placeholder="Seleccionar coordinador">
      {coordinadorSeleccionado
        ? `${coordinadorSeleccionado.Nombre} ${coordinadorSeleccionado.APaterno} ${coordinadorSeleccionado.AMaterno}`
        : "Seleccionar coordinador"}
    </SelectValue>
  </SelectTrigger>
  <SelectContent className="bg-white dark:bg-slate-950">
    {usuariosDisponibles.map((u) => (
      <SelectItem key={u.Id_usuario} value={String(u.Id_usuario)}>
        {u.Nombre} {u.APaterno} {u.AMaterno}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
</div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Colaboradores</label>
          <HoverCard>
            <HoverCardTrigger asChild>
              <button className="flex items-center justify-center rounded-full p-2 shadow-md transition-all duration-200 hover:scale-110 hover:bg-neutral-200 active:scale-95 text-neutral-700 dark:text-neutral-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-circle-plus">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
                  <path d="M9 12h6" />
                  <path d="M12 9v6" />
                </svg>
              </button>
            </HoverCardTrigger>

            <HoverCardContent className="w-64 p-3 bg-white dark:bg-slate-900 border shadow-md rounded-md">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Agregar colaborador</h4>
                <p className="text-xs text-muted-foreground">
                  Crea un nuevo registro de colaborador asignándole un departamento.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
          {departamentoSeleccionado?.usuarios?.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 text-xs font-medium ">
              {departamentoSeleccionado.usuarios.length}
            </span>
          )}
        </div>

        {departamentoSeleccionado?.usuarios?.length > 0 ? (
<div className="rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 max-h-52 overflow-y-auto bg-white dark:bg-slate-950">            {departamentoSeleccionado.usuarios.map((usuario, i) => {
              const nombre = usuario.Nombre || usuario.nombre || "";
              const aPaterno = usuario.APaterno || usuario.aPaterno || "";
              const iniciales = `${nombre[0] || ""}${aPaterno[0] || ""}`.toUpperCase();

              return (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold">
            {iniciales}
          </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {nombre} {aPaterno} {usuario.AMaterno || usuario.aMaterno}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {usuario.Correo || usuario.correo}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-800 px-3 py-6 text-center">
            <p className="text-sm text-muted-foreground">Sin colaboradores asignados</p>
          </div>
        )}
      </div>
    </div>

    <DialogFooter>
      <Button type="button" onClick={handleGuardarCambios} disabled={guardando}>
  {guardando ? "Guardando..." : "Guardar Cambios"}
</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
    </>
  );
}

export default DepartamentoTabla;