import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import api from '../api/axios.js';

function presupuestosTable(){
        const [datos, setDatos] = useState([]);
        const [cargando, setCargando] = useState(true);
        const [error, setError] = useState(null);

        const [modalAbierto, setModalAbierto] = useState(false);
        const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState(null);

        const [modoModal, setModoModal] = useState(null); // "ver" o "editar"
        const [modalFormAbierto, setModalFormAbierto] = useState(false);

        const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
        const [idAEliminar, setIdAEliminar] = useState(null);

        // --- ESTADO PARA CREAR ---
        const [formData, setFormData] = useState({
            Id_Periodo: '',
            detalles: [{ id_categoria: '', monto_asignado: '', descripcion: '' }]
        });

        useEffect(() => {
    api.get('/presupuesto')
        .then((res) => {
            // Con Axios los datos ya vienen parseados en res.data
            const data = res.data;

            if (Array.isArray(data)) {
                setDatos(data);
                console.log(data);
            } else if (data && Array.isArray(data.data)) {
                setDatos(data.data);
            } else {
                setDatos([]);
            }
        })
        .catch((err) => {
            // Axios captura automáticamente códigos 4xx/5xx como el 401
            if (err.response && err.response.status === 401) {
                setError("Sesión expirada. Por favor, inicia sesión de nuevo.");
            } else {
                setError(err.message || "Error al obtener los presupuestos");
            }
        })
        .finally(() => {
            // Cierra el indicador de carga sin importar si dio éxito o error
            setCargando(false);
        });
}, []);
        const handleAbrirModal = (presupuesto) => {
            setPresupuestoSeleccionado(presupuesto);
            setModalAbierto(true);
        }

        const handleAbrirCrear = () => {
            setModoModal("crear");
            setFormData({
                Id_Presupuesto: '',
                Id_Departamento: '',
                Id_Periodo: '',
                Monto_Aprobado: '',
                Monto_Ejercido: '',
                Estado: ''
            });
            setModalFormAbierto(true);
        }

        const handleAbrirEditar = (presupuesto, e) => {
            e.stopPropagation(); // Evita que al dar clic se abra también el modal de la fila
            setModoModal("editar");
            setPresupuestoSeleccionado(presupuesto);
            setFormData({
                Id_Presupuesto: presupuesto.id_Presupuesto,
                Id_Departamento: presupuesto.Id_Departamento,
                Id_Periodo: presupuesto.Id_Periodo,
                Monto_Aprobado: presupuesto.Monto_Aprobado,
                Monto_Ejercido: presupuesto.Monto_Ejercido,
                Estado: presupuesto.Estado
            });
            setModalFormAbierto(true);
        }

        const handleGuardar = async (e) => {
    e.preventDefault();
    try {
        if (modoModal === 'crear') {
            const res = await api.post('/presupuesto', formData);
            setDatos([...datos, res.data]); // Actualiza la tabla localmente
        } else if (modoModal === 'editar') {
            const id = presupuestoSeleccionado.id_Presupuesto;
            const res = await api.put(`/presupuesto/${id}`, formData);
            setDatos(datos.map(item => item.id_Presupuesto === id ? res.data : item));
        }
        setModalFormAbierto(false);
    } catch (err) {
        alert("Error al guardar: " + (err.response?.data?.message || err.message));
    }
};

// --- MANEJO DE ELIMINAR ---
const handleConfirmarEliminar = (id, e) => {
    e.stopPropagation();
    setIdAEliminar(id);
    setModalEliminarAbierto(true);
};

const handleEliminar = async () => {
    try {
        await api.delete(`/presupuesto/${idAEliminar}`);
        setDatos(datos.filter(item => item.id_Presupuesto !== idAEliminar));
        setModalEliminarAbierto(false);
    } catch (err) {
        alert("Error al eliminar: " + (err.response?.data?.message || err.message));
    }
};
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
                    <HoverCard>
                {/* El disparador: Al pasar el mouse sobre lo que esté aquí dentro, se activará la tarjeta */}
                <HoverCardTrigger asChild>
                    <button className="flex items-center justify-center rounded-full p-2 shadow-md transition-all duration-200 hover:scale-110 hover:bg-neutral-200 active:scale-95 text-neutral-700 dark:text-neutral-300" onClick={handleAbrirCrear}>
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
            {/** Tabla de Presupuestos */}
            <div className="w-full overflow-x-auto rounded-md border bg-card">
                <Table className="min-w-[1100px] w-full" >
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">ID</TableHead>
                            <TableHead>Departamento</TableHead>
                            <TableHead>Periodo</TableHead>
                            <TableHead>Coordinador</TableHead>
                            <TableHead>Monto Aprobado</TableHead>
                            <TableHead>Monto ejercido</TableHead>
                            <TableHead className="w-[120px]">Estado</TableHead>
                            <TableHead className="text-right pr-1 w-[120px]">Acciones</TableHead>
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
                            {presupuesto.departamento?.coordinador ? (`${presupuesto.departamento.coordinador.Nombre} ${presupuesto.departamento.coordinador.APaterno} ${presupuesto.departamento.coordinador.AMaterno}`
                            ) : (
                            `ID: ${presupuesto.departamento?.Id_Coordinador || 'Sin asignar'}`
                            )}
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
                        <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                presupuesto.Estado === 'aprobado'
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                            }`}>
                                {presupuesto.Estado.toUpperCase()}
                            </span>
                        </TableCell>
                        <TableCell className="text-center">
                            <button onClick={(e) => handleAbrirEditar(presupuesto, e)} className="inline-flex items-center justify-center rounded-full p-2 text-muted-foreground transition-all duration-200 hover:scale-110 hover:bg-neutral-200 hover:text-black dark:hover:bg-slate-800 dark:hover:text-white active:scale-95" 
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-pencil">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" />
                                <path d="M13.5 6.5l4 4" />
                                </svg>
                                </button>
                        </TableCell>
                        <TableCell className="text-center">
                            <button onClick={(e) => handleConfirmarEliminar(presupuesto.id_Presupuesto, e)} className="inline-flex items-center justify-center rounded-full p-2 text-red-500 transition-all duration-200 hover:scale-110 hover:bg-red-50 dark:hover:bg-red-950/30 active:scale-95"
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
                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
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
            {/* MODAL PARA CREAR Y EDITAR */}
<Dialog open={modalFormAbierto} onOpenChange={setModalFormAbierto}>
    <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900">
        <DialogHeader>
            <DialogTitle>
                {modoModal === 'crear' ? 'Agregar Presupuesto' : 'Editar Presupuesto'}
            </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleGuardar} className="space-y-4 pt-4">
            <div>
                <label className="text-sm font-medium">ID Departamento</label>
                <Input 
                    type="number" 
                    value={formData.Id_Departamento}
                    onChange={(e) => setFormData({...formData, Id_Departamento: e.target.value})}
                    required
                />
            </div>
            <div>
                <label className="text-sm font-medium">ID Periodo</label>
                <Input 
                    type="number" 
                    value={formData.Id_Periodo}
                    onChange={(e) => setFormData({...formData, Id_Periodo: e.target.value})}
                    required
                />
            </div>
            <div>
                <label className="text-sm font-medium">Monto Aprobado</label>
                <Input 
                    type="number" 
                    step="0.01"
                    value={formData.Monto_Aprobado}
                    onChange={(e) => setFormData({...formData, Monto_Aprobado: e.target.value})}
                    required
                />
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setModalFormAbierto(false)}>
                    Cancelar
                </Button>
                <Button type="submit">
                    {modoModal === 'crear' ? 'Guardar' : 'Actualizar'}
                </Button>
            </div>
        </form>
    </DialogContent>
</Dialog>

{/* MODAL DE CONFIRMACIÓN PARA ELIMINAR */}
<Dialog open={modalEliminarAbierto} onOpenChange={setModalEliminarAbierto}>
    <DialogContent className="sm:max-w-[400px] bg-white dark:bg-slate-900">
        <DialogHeader>
            <DialogTitle>¿Confirmar eliminación?</DialogTitle>
            <DialogDescription>
                Esta acción no se puede deshacer. Se eliminará el presupuesto permanentemente.
            </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setModalEliminarAbierto(false)}>
                Cancelar
            </Button>
            <Button variant="destructive" onClick={handleEliminar}>
                Eliminar
            </Button>
        </div>
    </DialogContent>
</Dialog>
               
    </>
);
}
export default presupuestosTable;