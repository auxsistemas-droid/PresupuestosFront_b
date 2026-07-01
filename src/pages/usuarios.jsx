import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
                    <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all bg-blue-600 text-white hover:bg-blue-700 h-9 px-4 py-2 shadow hover:scale-105">
                        Agregar
                    </button>
                    <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 shadow-sm hover:scale-105">
                        Editar
                    </button>
                    <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all bg-red-600 text-white hover:bg-red-700 h-9 px-4 py-2 shadow hover:scale-105">
                        Eliminar
                    </button>
                </div>
            </div>

            {/** Tabla de Usuarios */}
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead>Nombre Completo</TableHead>
                            <TableHead>Correo Electrónico</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead className="text-right">Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
    {datos.length > 0 ? (
        datos.map((usuario, index) => (
            <TableRow key={index}>
                {/* ID del usuario (Limpiado para apuntar directo a tu backend) */}
                <TableCell className="font-medium">
                    {usuario.Id_usuario}
                </TableCell>
                
                {/* Nombre y Apellidos (Usando tus mayúsculas exactas) */}
                <TableCell>
                    {`${usuario.Nombre || ''} ${usuario.APaterno || ''} ${usuario.AMaterno || ''}`.trim() || 'Sin Nombre'}
                </TableCell>
                
                {/* Correo Electrónico */}
                <TableCell>
                    {usuario.Correo}
                </TableCell>
                
                {/* Mapeo dinámico para múltiples roles en formato de Badges */}
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