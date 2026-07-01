import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
function presupuestosTable(){
        const [datos, setDatos] = useState([]);
        const [cargando, setCargando] = useState(true);
        const [error, setError] = useState(null);

        const [modalAbierto, setModalAbierto] = useState(false);
        const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState(null);

        useEffect(() => {
            // Actualizado al endpoint de usuarios
            fetch('http://localhost:3000/api/presupuesto', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include' 
            })
            .then((res) => {
                if (!res.ok) {
                    if (res.status === 401) throw new Error("Sesión expirada. Por favor, inicia sesión de nuevo.");
                    throw new Error("Error al obtener los presupuestos");
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

        const handleAbrirModal = (presupuesto) => {
            setPresupuestoSeleccionado(presupuesto);
            setModalAbierto(true);
        }

    
        if (cargando) return <p className="p-6 text-center text-muted-foreground">Cargando usuarios...</p>;
        if (error) return <p className="p-6 text-center text-red-500">Error: {error}</p>;

        const formatearMoneda = (monto) => {
            return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto);
        }
    
    return (
        <>
        <div className="p-6 max-w-7xl mx-auto pt-12">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold tracking-tighter">Captura de Presupuestos</h1>
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
            {/** Tabla de Presupuestos */}
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead>Departamento</TableHead>
                            <TableHead>Periodo</TableHead>
                            <TableHead>Coordinador</TableHead>
                            <TableHead>Monto Aprobado</TableHead>
                            <TableHead>Monto ejercido</TableHead>
                            <TableHead className="text-right">Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {datos.length > 0 ? (
                            datos.map((presupuesto, index) => (
                        <TableRow key={index}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleAbrirModal(presupuesto)}
                        >
                        <TableCell className="font-medium">
                            {presupuesto.id_Presupuesto}
                        </TableCell>
                
                        <TableCell>
                            {presupuesto.departamento?.Nombre || 'Sin Departamento'}
                        </TableCell>
                
                        <TableCell>
                            {presupuesto.periodo?.Nombre || 'Sin Periodo'}
                        </TableCell>
                
                        <TableCell>
                            {presupuesto.departamento?.Nombre || `ID: ${presupuesto.departamento?.Id_Coordinador}`}
                        </TableCell>
                        
                        {/* Monto Aprobado */}
                        <TableCell>
                            {formatearMoneda(presupuesto.Monto_Aprobado)}
                        </TableCell>
                        
                        {/* Monto Ejercido */}
                        <TableCell>
                            {formatearMoneda(presupuesto.Monto_Ejercido)}
                        </TableCell>
                
                        {/* Estado */}
                        <TableCell className="text-right">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                presupuesto.Estado === 'aprobado'
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                            }`}>
                                {presupuesto.Estado.toUpperCase()}
                            </span>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                <TableRow>
                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                        No se encontraron presupuestos registrados.
                    </TableCell>
                </TableRow>
            )}
                    </TableBody>
                </Table>
            </div>
        </div> 
        {/* ================= PANTALLA EMERGENTE (MODAL) ================= */}
            <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
                <DialogContent className="w-[70vw] !max-w-[90vw] max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900">
                    {presupuestoSeleccionado && (
                        
                        <>
                            <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            >
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">
                                    Desglose: {presupuestoSeleccionado.departamento?.Nombre}
                                </DialogTitle>
                                <DialogDescription className="text-base">
                                    Periodo: {presupuestoSeleccionado.periodo?.Nombre} ({presupuestoSeleccionado.periodo?.Tipo})
                                    <br />
                                    Vigencia: del {presupuestoSeleccionado.periodo?.Fecha_I} al {presupuestoSeleccionado.periodo?.Fecha_F}
                                </DialogDescription>
                            </DialogHeader>

                            {/* Resumen numérico rápido */}
                            <div className="grid grid-cols-3 gap-4 my-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border">
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Aprobado</p>
                                    <p className="text-xl font-bold">{formatearMoneda(presupuestoSeleccionado.Monto_Aprobado)}</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border">
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Ejercido</p>
                                    <p className="text-xl font-bold text-amber-600">{formatearMoneda(presupuestoSeleccionado.Monto_Ejercido)}</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border">
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Disponible</p>
                                    <p className="text-xl font-bold text-green-600">
                                        {formatearMoneda(Number(presupuestoSeleccionado.Monto_Aprobado) - Number(presupuestoSeleccionado.Monto_Ejercido))}
                                    </p>
                                </div>
                            </div>

                            {/* Sub-tabla con las partidas detalladas */}
                            <div className=" rounded-md border mt-4">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="w-[150px]">Categoría</TableHead>
                                            <TableHead>Descripción</TableHead>
                                            <TableHead className="text-right w-[150px]">Monto Asignado</TableHead>
                                            <TableHead className="text-right w-[150px]">Monto Ejercido</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {presupuestoSeleccionado.detalles && presupuestoSeleccionado.detalles.length > 0 ? (
                                            presupuestoSeleccionado.detalles.map((detalle, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-semibold">
                                                        {detalle.Categoria_Nombre || `ID Categoría: ${detalle.Id_Categoria}`}
                                                    </TableCell>
                                                    <TableCell className="text-sm">{detalle.Descripcion}</TableCell>
                                                    <TableCell className="text-right">{formatearMoneda(detalle.Monto_Asignado)}</TableCell>
                                                    <TableCell className="text-right text-muted-foreground">{formatearMoneda(detalle.Monto_Ejercido)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center h-16 text-muted-foreground">
                                                    Este presupuesto no cuenta con partidas desglosadas.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            </motion.div>  
                        </>
                    )}
                </DialogContent>
            </Dialog>
               
    </>
);
}
export default presupuestosTable;