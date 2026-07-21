import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

function UsuariosTabla() {
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Actualizado al endpoint de usuarios
        fetch('http://localhost:3000/api/users', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include' 
        })
        .then((res) => {
            if (!res.ok) {
                if (res.status === 401) throw new Error("Sesión expirada. Por favor, inicia sesión de nuevo.");
                throw new Error("Error al obtener los usuarios");
            }
            return res.json();
        })
        .then((data) => {
            // Validamos la estructura de la respuesta de la misma forma
            if (Array.isArray(data)) {
                setDatos(data);
                console.log(data);
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

    if (cargando) return <p className="p-6 text-center text-muted-foreground">Cargando usuarios...</p>;
    if (error) return <p className="p-6 text-center text-red-500">Error: {error}</p>;

    return (
        <div className='p-6 max-w-5xl mx-auto pt-12'>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold tracking-tighter">Gestión de Usuarios</h1>
            </div>
            
            <div className="flex gap-2 justify-between items-center mb-6">
                {/** Buscador */}
                <div className="flex gap-1 items-center">
                    <Input type="search" placeholder="Buscar usuario..." className="h-9 w-64" />
                    <Button className="h-9 bg-black text-white rounded-md transition-all duration-200 hover:scale-105 hover:bg-black/90">
                        Buscar
                    </Button>
                </div>
                {/** Acciones */}
                <div className="flex gap-2">
                    <div className="flex gap-2">
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
            </div>

            {/** Tabla de Usuarios */}
            <div className="w-full overflow-x-auto rounded-md border bg-card">
                <Table className="min-w-[1100px] w-full" >
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead>Nombre Completo</TableHead>
                            <TableHead>Correo Electrónico</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-center">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {datos.length > 0 ? (
                            datos.map((usuario, index) => (
                        <TableRow key={index}>
                        <TableCell className="font-medium">
                            {usuario.Id_usuario}
                        </TableCell>
                
                        <TableCell>
                            {`${usuario.Nombre || ''} ${usuario.APaterno || ''} ${usuario.AMaterno || ''}`.trim() || 'Sin Nombre'}
                        </TableCell>
                
                        <TableCell>
                            {usuario.Correo}
                        </TableCell>
                
                        <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-[220px]">
                                {usuario.usuarioRoles && usuario.usuarioRoles.length > 0 ? (
                                    usuario.usuarioRoles.map((userRol, rolIndex) => (
                                        <span 
                                            key={rolIndex} 
                                            className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                                        >
                                            {userRol.rol?.Nombre || 'Sin Nombre'}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-muted-foreground text-sm italic">Sin rol</span>
                                )}
                            </div>
                        </TableCell>
                
                        {/* Estado Activo / Inactivo */}
                            <TableCell className="text-right">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                usuario.Activo
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                }`}>
                                    {usuario.Activo ? "Activo" : "Inactivo"}
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
                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                        No se encontraron usuarios registrados.
                        </TableCell>
                    </TableRow>
                    )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

export default UsuariosTabla;