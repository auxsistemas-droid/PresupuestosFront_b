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
import Swal from 'sweetalert2';
import api from "../api/axios";

function PeriodoTabla() {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(null);

  // Formulario
  const [formNombre, setFormNombre] = useState("");
  const [formTipo, setFormTipo] = useState("semestral");
  const [formFechaI, setFormFechaI] = useState("");
  const [formFechaF, setFormFechaF] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState(null);

  useEffect(() => {
  api.get('/periodos-fiscales') // <-- Cambiado de /periodos a /periodos-fiscales
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
        setError("Error al cargar los periodos. Por favor, intenta nuevamente.");
      }
    })
    .finally(() => {
      setCargando(false);
    });
}, []);

  const handleAbrirModalCrear = () => {
    setFormNombre("");
    setFormTipo("semestral");
    setFormFechaI("");
    setFormFechaF("");
    setErrorGuardar(null);
    setModalCrearAbierto(true);
  };

  const handleCrearPeriodo = () => {
    setGuardando(true);
    setErrorGuardar(null);

    const nuevoPeriodo = {
      Nombre: formNombre,
      Tipo: formTipo,
      Fecha_I: formFechaI,
      Fecha_F: formFechaF
    };

    api.post('/periodos-fiscales', nuevoPeriodo) 
      .then((res) => {
        setDatos((prevDatos) => [...prevDatos, res.data]);
        setModalCrearAbierto(false);
        Swal.fire({
          title: "Periodo creado",
          icon: "success",
        });
      })
      .catch(() => {
        setErrorGuardar("No se pudo crear el periodo. Intenta nuevamente.");
      })
      .finally(() => {
        setGuardando(false);
      });
  };

  const handleAbrirModalDetalles = (periodo) => {
    setPeriodoSeleccionado(periodo);
    setFormNombre(periodo.Nombre || "");
    setFormTipo(periodo.Tipo || "semestral");
    setFormFechaI(periodo.Fecha_I || "");
    setFormFechaF(periodo.Fecha_F || "");
    setErrorGuardar(null);
    setModalAbierto(true);
  };

  const handleGuardarCambios = () => {
    setGuardando(true);
    setErrorGuardar(null);

    const id = periodoSeleccionado.Id_Periodos; // Uso correcto de Id_Periodos

    const periodoActualizado = {
      Nombre: formNombre,
      Tipo: formTipo,
      Fecha_I: formFechaI,
      Fecha_F: formFechaF
    };

    api.put(`/periodos-fiscales/${id}`, periodoActualizado) 
      .then(() => {
        setDatos((prevDatos) =>
          prevDatos.map((p) =>
            p.Id_Periodos === id
              ? { ...p, ...periodoActualizado }
              : p
          )
        );
        setModalAbierto(false);
        Swal.fire({
          title: "Actualizado",
          text: "Periodo actualizado correctamente.",
          icon: "success"
        });
      })
      .catch(() => {
        setErrorGuardar("No se pudo guardar el cambio. Intenta nuevamente.");
      })
      .finally(() => {
        setGuardando(false);
      });
  };

  const handleEliminarPeriodo = (id) => {
    Swal.fire({
      title: "¿Estás seguro de eliminar el periodo?",
      text: "¡Si lo haces no podrás revertirlo!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar!"
    }).then((result) => {
      if (result.isConfirmed) {
        api.delete(`/periodos-fiscales/${id}`) 
          .then(() => {
            setDatos((prevDatos) => prevDatos.filter((p) => p.Id_Periodos !== id));
            Swal.fire({
              title: "¡Eliminado!",
              text: "El periodo ha sido eliminado.",
              icon: "success"
            });
          })
          .catch(() => {
            Swal.fire({
              title: "Error al eliminar el periodo",
              icon: "error",
            });
          });
      }
    });
  };

  if (cargando) return <p className="p-6 text-center text-muted-foreground">Cargando periodos...</p>;
  if (error) return <p className="p-6 text-center text-red-500">Error: {error}</p>;

  return (
    <>
      <div className="p-6 max-w-5xl mx-auto pt-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold tracking-tight">Gestión de Periodos</h2>
        </div>

        <div className="flex gap-2 justify-between items-center mb-4">
          <div className="flex gap-1 items-center">
            <Input type="search" placeholder="Buscar periodo..." className="h-9 w-64" />
            <Button className="h-9 bg-black text-white rounded-md transition-transform duration-200 hover:scale-105 hover:bg-black/90">
              Buscar
            </Button>
          </div>
          <div className="flex gap-2 items-center">
            <HoverCard>
              <HoverCardTrigger asChild>
                <button onClick={handleAbrirModalCrear} className="flex items-center justify-center rounded-full p-2 shadow-md transition-all duration-200 hover:scale-110 hover:bg-neutral-200 active:scale-95 text-neutral-700 dark:text-neutral-300">
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
                  <h4 className="text-sm font-semibold">Agregar Periodo</h4>
                  <p className="text-xs text-muted-foreground">
                    Crea un nuevo periodo académico con sus fechas de inicio y fin.
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
                <TableHead>Nombre del Periodo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha Inicio</TableHead>
                <TableHead>Fecha Fin</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-center" colSpan={2}>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datos.length > 0 ? (
                datos.map((periodo) => (
                  <TableRow
                    key={periodo.Id_Periodos}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleAbrirModalDetalles(periodo)}
                  >
                    
                    <TableCell>{periodo.Nombre}</TableCell>
                    <TableCell className="capitalize">{periodo.Tipo}</TableCell>
                    <TableCell>{periodo.Fecha_I}</TableCell>
                    <TableCell>{periodo.Fecha_F}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        periodo.Activo
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {periodo.Activo ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>

                    <TableCell className="text-center">
                      <button
                        className="inline-flex items-center justify-center rounded-full p-2 text-muted-foreground transition-all duration-200 hover:scale-110 hover:bg-neutral-200 hover:text-black dark:hover:bg-slate-800 dark:hover:text-white active:scale-95"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAbrirModalDetalles(periodo);
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
                          handleEliminarPeriodo(periodo.Id_Periodos);
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
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    No se encontraron periodos registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ================= MODAL EDITAR PERIODO ================= */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>Editar Periodo</DialogTitle>
            <DialogDescription>
              Modifica los detalles del periodo seleccionado.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {errorGuardar && (
              <p className="text-sm text-red-500 font-medium">{errorGuardar}</p>
            )}

            <div className="grid gap-2">
              <label htmlFor="nombre" className="text-sm font-medium">Nombre del Periodo</label>
              <Input
                id="nombre"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={formTipo} onValueChange={setFormTipo}>
                <SelectTrigger className="bg-white dark:bg-slate-950">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-950">
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="cuatrimestral">Cuatrimestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Fecha Inicio</label>
                <Input
                  type="date"
                  value={formFechaI}
                  onChange={(e) => setFormFechaI(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Fecha Fin</label>
                <Input
                  type="date"
                  value={formFechaF}
                  onChange={(e) => setFormFechaF(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" onClick={handleGuardarCambios} disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL CREAR PERIODO ================= */}
      <Dialog open={modalCrearAbierto} onOpenChange={setModalCrearAbierto}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Periodo</DialogTitle>
            <DialogDescription>
              Ingresa los datos para registrar un nuevo periodo.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {errorGuardar && (
              <p className="text-sm text-red-500 font-medium">{errorGuardar}</p>
            )}

            <div className="grid gap-2">
              <label htmlFor="nombreCrear" className="text-sm font-medium">Nombre del Periodo</label>
              <Input
                id="nombreCrear"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                placeholder="Ej. Segundo semestre 2026"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={formTipo} onValueChange={setFormTipo}>
                <SelectTrigger className="bg-white dark:bg-slate-950">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-950">
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="cuatrimestral">Cuatrimestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Fecha Inicio</label>
                <Input
                  type="date"
                  value={formFechaI}
                  onChange={(e) => setFormFechaI(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Fecha Fin</label>
                <Input
                  type="date"
                  value={formFechaF}
                  onChange={(e) => setFormFechaF(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalCrearAbierto(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCrearPeriodo}
              disabled={guardando}
            >
              {guardando ? "Creando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default PeriodoTabla;