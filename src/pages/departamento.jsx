import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

function DepartamentoTabla() {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token'); 

    // Apuntando a la API correcta de departamento
    fetch('http://localhost:3000/api/departamento', {
        method: 'GET',
        headers: {
        'Content-Type': 'application/json',
    },
     credentials: 'include' 
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) throw new Error("Sesión expirada. Por favor, inicia sesión de nuevo.");
          throw new Error("Error al obtener los departamentos");
        }
        return res.json();
      })
      .then((data) => {
        // Validación de seguridad para el .map()
        if (Array.isArray(data)) {
          setDatos(data);
        } else if (data.data && Array.isArray(data.data)) {
          setDatos(data.data);
        } else {
          setDatos([]);
        }
        setCargando(false);
      })
      .catch((err) => {
        setError(err.message);
        setCargando(false);
      });
  }, []);

  if (cargando) return <p className="p-6 text-center text-muted-foreground">Cargando departamentos...</p>;
  if (error) return <p className="p-6 text-center text-red-500">Error: {error}</p>;

  return (
    <>
    <div className="p-6 max-w-5xl mx-auto pt-12">
    <h1>Administración de Departamentos</h1>
    <div className="p-6 max-w-5xl mx-auto">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl font-bold tracking-tight">Gestión de Departamentos</h2>
    </div>
    <br />
    <div className="flex gap-2 justify-between items-center mb-4">
      <div className="flex gap-1 items-center">
        <Input type="search" placeholder="Buscar departamento..." className="h-9 w-64" />
        <Button className="h-9 bg-black text-white rounded-md transition-transform duration-200 hover:scale-105 hover:bg-black/90">
          Buscar
        </Button>
      </div>
      <div className="flex gap-2 items-center">
        <HoverCard>
          {/* El disparador: Al pasar el mouse sobre lo que esté aquí dentro, se activará la tarjeta */}
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

          {/* El contenido: Lo que se muestra al hacer Hover */}
          <HoverCardContent className="w-64 p-3 bg-white dark:bg-slate-900 border shadow-md rounded-md">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">Agregar Presupuesto</h4>
              <p className="text-xs text-muted-foreground">
                Crea un nuevo registro de presupuesto asignándole un departamento, periodo y un monto base.
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
            {/* Cambiamos el encabezado para que refleje el nombre */}
            <TableHead>Coordinador</TableHead> 
            <TableHead>Estado</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {datos.length > 0 ? (
            datos.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  {item.Id_departamento || item.idDepartamento || item.id}
                </TableCell>
                <TableCell>{item.Nombre || item.nombre}</TableCell>
                
                {/* DESGLOSE DEL COORDINADOR AQUÍ */}
                <TableCell>
                  {item.coordinador ? (
                    `${item.coordinador.Nombre || item.coordinador.nombre} ${item.coordinador.APaterno || item.coordinador.aPaterno} ${item.coordinador.AMaterno || item.coordinador.aMaterno}`
                  ) : (
                    <span className="text-muted-foreground italic">Sin asignar</span>
                  )}
                </TableCell>

                <TableCell className="text-right">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    item.Activo || item.activo
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {item.Activo || item.activo ? "Activo" : "Inactivo"}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                <button className="inline-flex items-center justify-center rounded-full p-2 text-muted-foreground transition-all duration-200 hover:scale-110 hover:bg-neutral-200 hover:text-black dark:hover:bg-slate-800 dark:hover:text-white active:scale-95" 
                                onClick={(e) => {
                                e.stopPropagation();
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
                                                <button className="inline-flex items-center justify-center rounded-full p-2 text-red-500 transition-all duration-200 hover:scale-110 hover:bg-red-50 dark:hover:bg-red-950/30 active:scale-95"
                                                onClick={(e) => {
                                                e.stopPropagation(); // Evita que al dar clic se abra también el modal de la fila
                                                                    // Aquí pones tu función para eliminar
                                                }}
                                                >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-trash-x">
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
              <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                No se encontraron departamentos registrados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  </div>
  </div>
  </>
);
}
export default DepartamentoTabla;