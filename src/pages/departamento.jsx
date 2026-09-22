import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  UserPlus,
  X,
  Users,
  Loader2,
  Building2,
} from "lucide-react";
import Swal from "sweetalert2";
import api from "../api/axios";

export default function DepartamentoTabla() {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Estados del Buscador
  const [busqueda, setBusqueda] = useState("");

  // Estados de Formulario y Modal Único
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoModal, setModoModal] = useState("crear"); // "crear" | "editar"
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState(null);

  const [formNombre, setFormNombre] = useState("");
  const [coordinadorId, setCoordinadorId] = useState("");
  const [colaboradoresSeleccionados, setColaboradoresSeleccionados] = useState([]);
  const [nuevoColaboradorId, setNuevoColaboradorId] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState(null);

  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);

  // Cargar datos al montar
  useEffect(() => {
    fetchDepartamentos();
    fetchUsuarios();
  }, []);

  const fetchDepartamentos = () => {
    setCargando(true);
    api
      .get("/departamento")
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data)) setDatos(data);
        else if (data.data && Array.isArray(data.data)) setDatos(data.data);
        else setDatos([]);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          setError("Sesión expirada. Por favor, inicia sesión nuevamente.");
        } else {
          setError("Error al cargar los departamentos.");
        }
      })
      .finally(() => setCargando(false));
  };

  const fetchUsuarios = () => {
    api
      .get("/users")
      .then((res) => {
        const data = res.data;
        setUsuariosDisponibles(Array.isArray(data) ? data : data.data || []);
      })
      .catch(() => setUsuariosDisponibles([]));
  };

  // Abrir Modal para Crear
  const handleAbrirCrear = () => {
    setModoModal("crear");
    setDepartamentoSeleccionado(null);
    setFormNombre("");
    setCoordinadorId("");
    setColaboradoresSeleccionados([]);
    setErrorGuardar(null);
    setModalAbierto(true);
  };

  // Abrir Modal para Editar / Ver Detalles
  const handleAbrirEditar = (departamento) => {
    setModoModal("editar");
    setDepartamentoSeleccionado(departamento);
    setFormNombre(departamento.Nombre || departamento.nombre || "");
    
    // Asignación segura de ID de coordinador
    const coordId = departamento.coordinador?.Id_usuario || departamento.coordinador?.id || "";
    setCoordinadorId(coordId ? String(coordId) : "");
    
    // Asignación inicial de colaboradores existentes
    setColaboradoresSeleccionados(departamento.usuarios || []);
    setErrorGuardar(null);
    setModalAbierto(true);
  };

  // Agregar Colaborador en el Modal
  const handleAgregarColaborador = () => {
    if (!nuevoColaboradorId) return;
    const usuario = usuariosDisponibles.find(
      (u) => String(u.Id_usuario || u.id) === String(nuevoColaboradorId)
    );

    const userId = usuario?.Id_usuario || usuario?.id;

    if (usuario && !colaboradoresSeleccionados.some((c) => (c.Id_usuario || c.id) === userId)) {
      setColaboradoresSeleccionados([...colaboradoresSeleccionados, usuario]);
    }
    setNuevoColaboradorId("");
  };

  // Remover Colaborador de la lista temporal
  const handleRemoverColaborador = (idUsuario) => {
    setColaboradoresSeleccionados(
      colaboradoresSeleccionados.filter((u) => (u.Id_usuario || u.id) !== idUsuario)
    );
  };

  // Guardar (Crear o Editar)
  const handleGuardar = async () => {
  if (!formNombre.trim()) {
    setErrorGuardar("El nombre del departamento es obligatorio.");
    return;
  }

  setGuardando(true);
  setErrorGuardar(null);

  try {
    const payloadDept = {
      Nombre: formNombre,
      Id_Coordinador: coordinadorId ? Number(coordinadorId) : null, // <-- ajustar nombre real del campo
    };

    let deptId;

    if (modoModal === "crear") {
      const res = await api.post("/departamento", payloadDept);
      deptId = res.data.Id_departamento || res.data.id;
    } else {
      deptId = departamentoSeleccionado.Id_departamento || departamentoSeleccionado.id;
      await api.put(`/departamento/${deptId}`, payloadDept);
    }

    // --- Sincronizar colaboradores (diff entre lo que había y lo que quedó) ---
    const idsOriginales = (departamentoSeleccionado?.usuarios || []).map(
      (u) => String(u.Id_usuario || u.id)
    );
    const idsNuevos = colaboradoresSeleccionados.map((u) => String(u.Id_usuario || u.id));

    const agregados = idsNuevos.filter((id) => !idsOriginales.includes(id));
    const removidos = idsOriginales.filter((id) => !idsNuevos.includes(id));

    const peticionesColaboradores = [
      ...agregados.map((id) => api.put(`/users/${id}`, { Id_Departamento: deptId })),
      ...removidos.map((id) => api.put(`/users/${id}`, { Id_Departamento: null })),
    ];

    // Además, asegurar que el coordinador también quede vinculado al depto (si tu regla de negocio lo requiere)
    if (coordinadorId && !idsNuevos.includes(String(coordinadorId))) {
      peticionesColaboradores.push(
        api.put(`/users/${coordinadorId}`, { Id_Departamento: deptId })
      );
    }

    await Promise.all(peticionesColaboradores);

    Swal.fire({
      title: modoModal === "crear" ? "¡Creado!" : "¡Actualizado!",
      text: "Los cambios se guardaron correctamente.",
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
    });

    await Promise.all([fetchDepartamentos(), fetchUsuarios()]);
    setModalAbierto(false);
  } catch (err) {
    setErrorGuardar("Ocurrió un error al guardar los datos. Inténtalo de nuevo.");
  } finally {
    setGuardando(false);
  }
};

  // Eliminar Departamento
  const handleEliminarDepartamento = (id) => {
    Swal.fire({
      title: "¿Eliminar departamento?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        api
          .delete(`/departamento/${id}`)
          .then(() => {
            setDatos((prev) => prev.filter((d) => (d.Id_departamento || d.id) !== id));
            Swal.fire("Eliminado", "El departamento ha sido removido.", "success");
          })
          .catch(() => {
            Swal.fire("Error", "No se pudo eliminar el departamento.", "error");
          });
      }
    });
  };

  // Búsqueda en tiempo real (Client side)
  const datosFiltrados = useMemo(() => {
    return datos.filter((dep) => {
      const nombre = (dep.Nombre || dep.nombre || "").toLowerCase();
      const coordNombre = dep.coordinador
        ? `${dep.coordinador.Nombre || dep.coordinador.nombre || ""} ${dep.coordinador.APaterno || dep.coordinador.aPaterno || ""}`.toLowerCase()
        : "";
      const term = busqueda.toLowerCase();
      return nombre.includes(term) || coordNombre.includes(term);
    });
  }, [datos, busqueda]);

  if (error) {
    return (
      <div className="p-12 text-center text-red-500 font-medium">
        <p>{error}</p>
        <Button variant="outline" className="mt-4" onClick={fetchDepartamentos}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Gestión de Departamentos
          </h1>
          <p className="text-sm text-muted-foreground">
            Administra los departamentos, coordinadores y equipos asignados.
          </p>
        </div>

        <Button onClick={handleAbrirCrear} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Nuevo Departamento
        </Button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por departamento o coordinador..."
            className="pl-9 h-10"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla Principal */}
      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-900/50">
              <TableHead>Nombre del Departamento</TableHead>
              <TableHead>Coordinador Responsable</TableHead>
              <TableHead>Colaboradores</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargando ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Cargando departamentos...
                  </div>
                </TableCell>
              </TableRow>
            ) : datosFiltrados.length > 0 ? (
              datosFiltrados.map((departamento, index) => {
                const id = departamento.Id_departamento || departamento.id || `dept-${index}`;
                const activo = departamento.Activo ?? departamento.activo ?? true;

                return (
                  <TableRow
                    key={id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => handleAbrirEditar(departamento)}
                  >
                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                      {departamento.Nombre || departamento.nombre}
                    </TableCell>

                    <TableCell>
                      {departamento.coordinador ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {departamento.coordinador.Nombre || departamento.coordinador.nombre}{" "}
                            {departamento.coordinador.APaterno || departamento.coordinador.aPaterno}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Sin asignar</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {departamento.usuarios?.length > 0 ? (
                        <Badge variant="secondary" className="gap-1 font-normal">
                          <Users className="h-3 w-3" />
                          {departamento.usuarios.length}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Sin asignar</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={activo ? "default" : "destructive"}
                        className={activo ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200 dark:text-emerald-400" : ""}
                      >
                        {activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleAbrirEditar(departamento)}
                          title="Editar departamento"
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground hover:text-slate-900" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEliminarDepartamento(id)}
                          title="Eliminar departamento"
                        >
                          <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No se encontraron resultados para la búsqueda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ================= MODAL UNIFICADO (CREAR / EDITAR) ================= */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-[550px] bg-white">
          <DialogHeader>
            <DialogTitle>
              {modoModal === "crear" ? "Crear Nuevo Departamento" : "Editar Departamento"}
            </DialogTitle>
            <DialogDescription>
              {modoModal === "crear"
                ? "Completa la información para dar de alta un nuevo departamento."
                : "Modifica los datos del departamento y gestiona a sus integrantes."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-3">
            {errorGuardar && (
              <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
                {errorGuardar}
              </div>
            )}

            {/* Nombre del departamento */}
            <div className="grid gap-1.5">
              <label htmlFor="nombre" className="text-sm font-medium">
                Nombre del Departamento <span className="text-red-500">*</span>
              </label>
              <Input
                id="nombre"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                placeholder="Ej. Recursos Humanos"
              />
            </div>

            {/* Selector de Coordinador */}
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Coordinador Asignado</label>
              <Select
                value={coordinadorId ? String(coordinadorId) : ""}
                onValueChange={(val) => setCoordinadorId(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar un coordinador" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border shadow-md">
                  {usuariosDisponibles.map((u, idx) => {
                    const uId = u.Id_usuario || u.id || `user-select-${idx}`;
                    return (
                      <SelectItem key={uId} value={String(uId)}>
                        {u.Nombre || u.nombre} {u.APaterno || u.aPaterno} {u.AMaterno || u.aMaterno || ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Asignación de Colaboradores */}
            <div className="grid gap-2 border-t pt-3 mt-2">
              <label className="text-sm font-medium">Colaboradores Asignados</label>

              {/* Selector para agregar nuevo colaborador */}
              <div className="flex gap-2">
                <Select
                  value={nuevoColaboradorId}
                  onValueChange={(val) => setNuevoColaboradorId(val)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Agregar usuario al equipo..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border shadow-md">
                    {usuariosDisponibles
                      .filter(
                        (u) =>
                          !colaboradoresSeleccionados.some(
                            (c) => String(c.Id_usuario || c.id) === String(u.Id_usuario || u.id)
                          )
                      )
                      .map((u, idx) => {
                        const uId = u.Id_usuario || u.id || `colab-select-${idx}`;
                        return (
                          <SelectItem key={uId} value={String(uId)}>
                            {u.Nombre || u.nombre} {u.APaterno || u.aPaterno}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAgregarColaborador}
                  disabled={!nuevoColaboradorId}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>

              {/* Lista de Colaboradores Agregados */}
              <div className="mt-2 max-h-40 overflow-y-auto border rounded-md divide-y bg-slate-50/50 dark:bg-slate-900/50">
                {colaboradoresSeleccionados.length > 0 ? (
                  colaboradoresSeleccionados.map((usuario, index) => {
                    const uId = usuario.Id_usuario || usuario.id || `colab-${index}`;
                    const nombre = usuario.Nombre || usuario.nombre || "";
                    const aPaterno = usuario.APaterno || usuario.aPaterno || "";

                    return (
                      <div
                        key={uId}
                        className="flex items-center justify-between p-2 text-sm px-3"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                            {nombre[0] || "U"}
                            {aPaterno[0] || ""}
                          </div>
                          <span className="truncate">
                            {nombre} {aPaterno}
                          </span>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-red-500"
                          onClick={() => handleRemoverColaborador(uId)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Sin colaboradores asignados a este departamento.
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalAbierto(false)}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleGuardar} disabled={guardando}>
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {modoModal === "crear" ? "Crear Departamento" : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}