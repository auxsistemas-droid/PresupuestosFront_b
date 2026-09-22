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
import Swal from 'sweetalert2';
import api from "../api/axios";

function CategoriaGastoTabla() {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

  // Estados del Formulario
  const [formCodigoCuenta, setFormCodigoCuenta] = useState("");
  const [formNombre, setFormNombre] = useState("");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [formAgrupacion, setFormAgrupacion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState(null);

  useEffect(() => {
    api.get('/categoria-gasto')
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
          setError("Error al cargar las categorías de gasto. Por favor, intenta nuevamente.");
        }
      })
      .finally(() => {
        setCargando(false);
      });
  }, []);

  const handleAbrirModalCrear = () => {
    setFormCodigoCuenta("");
    setFormNombre("");
    setFormDescripcion("");
    setFormAgrupacion("");
    setErrorGuardar(null);
    setModalCrearAbierto(true);
  };

  const handleCrearCategoria = () => {
    setGuardando(true);
    setErrorGuardar(null);

    const nuevaCategoria = {
      Codigo_Cuenta: formCodigoCuenta,
      Nombre: formNombre,
      Descripcion: formDescripcion,
      Agrupacion: formAgrupacion,
      Activo: true
    };

    api.post('/categoria-gasto', nuevaCategoria)
      .then((res) => {
        setDatos((prevDatos) => [...prevDatos, res.data]);
        setModalCrearAbierto(false);
        Swal.fire({
          title: "Categoría creada",
          text: "La categoría de gasto se registró correctamente.",
          icon: "success",
        });
      })
      .catch(() => {
        setErrorGuardar("No se pudo crear la categoría. Intenta nuevamente.");
      })
      .finally(() => {
        setGuardando(false);
      });
  };

  const handleAbrirModalDetalles = (categoria) => {
    setCategoriaSeleccionada(categoria);
    setFormCodigoCuenta(categoria.Codigo_Cuenta || "");
    setFormNombre(categoria.Nombre || "");
    setFormDescripcion(categoria.Descripcion || "");
    setFormAgrupacion(categoria.Agrupacion || "");
    setErrorGuardar(null);
    setModalAbierto(true);
  };

  const handleGuardarCambios = () => {
    setGuardando(true);
    setErrorGuardar(null);

    const id = categoriaSeleccionada.Id_Categoria;

    const categoriaActualizada = {
      Codigo_Cuenta: formCodigoCuenta,
      Nombre: formNombre,
      Descripcion: formDescripcion,
      Agrupacion: formAgrupacion
    };

    api.put(`/categoria-gasto/${id}`, categoriaActualizada)
      .then(() => {
        setDatos((prevDatos) =>
          prevDatos.map((c) =>
            c.Id_Categoria === id
              ? { ...c, ...categoriaActualizada }
              : c
          )
        );
        setModalAbierto(false);
        Swal.fire({
          title: "Actualizado",
          text: "Categoría actualizada correctamente.",
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

  const handleEliminarCategoria = (id) => {
    Swal.fire({
      title: "¿Estás seguro de eliminar la categoría?",
      text: "¡Si lo haces no podrás revertirlo!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar!"
    }).then((result) => {
      if (result.isConfirmed) {
        api.delete(`/categoria-gasto/${id}`)
          .then(() => {
            setDatos((prevDatos) => prevDatos.filter((c) => c.Id_Categoria !== id));
            Swal.fire({
              title: "¡Eliminado!",
              text: "La categoría ha sido eliminada.",
              icon: "success"
            });
          })
          .catch(() => {
            Swal.fire({
              title: "Error al eliminar la categoría",
              icon: "error",
            });
          });
      }
    });
  };

  if (cargando) return <p className="p-6 text-center text-muted-foreground">Cargando categorías de gasto...</p>;
  if (error) return <p className="p-6 text-center text-red-500">Error: {error}</p>;

  return (
    <>
      <div className="p-6 max-w-6xl mx-auto pt-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold tracking-tight">Gestión de Categorías de Gasto</h2>
        </div>

        <div className="flex gap-2 justify-between items-center mb-4">
          <div className="flex gap-1 items-center">
            <Input type="search" placeholder="Buscar categoría o cuenta..." className="h-9 w-64" />
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
                  <h4 className="text-sm font-semibold">Agregar Categoría</h4>
                  <p className="text-xs text-muted-foreground">
                    Crea una nueva categoría de gasto asignándole un código de cuenta y agrupación.
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        </div>

        <div className="rounded-md border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Código Cuenta</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="max-w-[300px]">Descripción</TableHead>
                <TableHead>Agrupación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-center" colSpan={2}>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datos.length > 0 ? (
                datos.map((categoria) => (
                  <TableRow
                    key={categoria.Id_Categoria}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleAbrirModalDetalles(categoria)}
                  >
                   
                    <TableCell className="font-mono text-xs">{categoria.Codigo_Cuenta}</TableCell>
                    <TableCell className="font-medium">{categoria.Nombre}</TableCell>
                    <TableCell className="max-w-[300px] truncate text-xs text-muted-foreground" title={categoria.Descripcion}>
                      {categoria.Descripcion}
                    </TableCell>
                    <TableCell className="text-xs">{categoria.Agrupacion}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        categoria.Activo
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {categoria.Activo ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>

                    <TableCell className="text-center">
                      <button
                        className="inline-flex items-center justify-center rounded-full p-2 text-muted-foreground transition-all duration-200 hover:scale-110 hover:bg-neutral-200 hover:text-black dark:hover:bg-slate-800 dark:hover:text-white active:scale-95"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAbrirModalDetalles(categoria);
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
                          handleEliminarCategoria(categoria.Id_Categoria);
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
                  <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                    No se encontraron categorías de gasto registradas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ================= MODAL EDITAR CATEGORÍA ================= */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-[550px] bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>Editar Categoría de Gasto</DialogTitle>
            <DialogDescription>
              Modifica los detalles de la categoría seleccionada.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {errorGuardar && (
              <p className="text-sm text-red-500 font-medium">{errorGuardar}</p>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 grid gap-2">
                <label htmlFor="codigoCuenta" className="text-sm font-medium">Código Cuenta</label>
                <Input
                  id="codigoCuenta"
                  value={formCodigoCuenta}
                  onChange={(e) => setFormCodigoCuenta(e.target.value)}
                  placeholder="Ej. 5220.21"
                />
              </div>
              <div className="col-span-2 grid gap-2">
                <label htmlFor="nombre" className="text-sm font-medium">Nombre</label>
                <Input
                  id="nombre"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="agrupacion" className="text-sm font-medium">Agrupación</label>
              <Input
                id="agrupacion"
                value={formAgrupacion}
                onChange={(e) => setFormAgrupacion(e.target.value)}
                placeholder="Ej. FORMACION PERMANENTE DEL PERSONAL"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="descripcion" className="text-sm font-medium">Descripción</label>
              <textarea
                id="descripcion"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formDescripcion}
                onChange={(e) => setFormDescripcion(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" onClick={handleGuardarCambios} disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL CREAR CATEGORÍA ================= */}
      <Dialog open={modalCrearAbierto} onOpenChange={setModalCrearAbierto}>
        <DialogContent className="sm:max-w-[550px] bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>Crear Nueva Categoría de Gasto</DialogTitle>
            <DialogDescription>
              Ingresa los datos para registrar una nueva categoría.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {errorGuardar && (
              <p className="text-sm text-red-500 font-medium">{errorGuardar}</p>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 grid gap-2">
                <label htmlFor="codigoCuentaCrear" className="text-sm font-medium">Código Cuenta</label>
                <Input
                  id="codigoCuentaCrear"
                  value={formCodigoCuenta}
                  onChange={(e) => setFormCodigoCuenta(e.target.value)}
                  placeholder="Ej. 5220.21"
                />
              </div>
              <div className="col-span-2 grid gap-2">
                <label htmlFor="nombreCrear" className="text-sm font-medium">Nombre</label>
                <Input
                  id="nombreCrear"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Ej. HONORARIOS A EXPOSITORES..."
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="agrupacionCrear" className="text-sm font-medium">Agrupación</label>
              <Input
                id="agrupacionCrear"
                value={formAgrupacion}
                onChange={(e) => setFormAgrupacion(e.target.value)}
                placeholder="Ej. FORMACION PERMANENTE DEL PERSONAL"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="descripcionCrear" className="text-sm font-medium">Descripción</label>
              <textarea
                id="descripcionCrear"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formDescripcion}
                onChange={(e) => setFormDescripcion(e.target.value)}
                placeholder="Descripción concisa de qué tipo de gastos aplica..."
              />
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
              onClick={handleCrearCategoria}
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

export default CategoriaGastoTabla;