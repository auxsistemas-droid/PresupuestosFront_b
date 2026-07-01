import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input";
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
    {/* Este contenedor se queda del lado izquierdo automáticamente */}
    <div className="flex gap-1 items-center">
        <Input type="search" placeholder="Buscar departamento..." className="h-9 w-64" />
        <Button className="h-9 bg-black text-white rounded-md transition-transform duration-200 hover:scale-105 hover:bg-black/90">
            Buscar
        </Button>
    </div>

    {/* contenedor derecha */}
    <div className="flex gap-2">
        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 h-9 px-4 py-2 shadow hover:scale-105">
            Agregar
        </button>
        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 shadow-sm hover:scale-105">
            Editar
        </button>
        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-destructive text-destructive-foreground hover:bg-destructive/90 bg-red-600 text-white hover:bg-red-700 h-9 px-4 py-2 shadow hover:scale-105">
            Eliminar
        </button>
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
            <TableHead className="text-right">Estado</TableHead>
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