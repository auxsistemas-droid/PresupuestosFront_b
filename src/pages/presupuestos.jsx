import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { motion, AnimatePresence } from "framer-motion";
import Swal from 'sweetalert2';
import api from '../api/axios.js';

function PresupuestosManager() {
    const [presupuestos, setPresupuestos] = useState([]);
    const [periodos, setPeriodos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [cargando, setCargando] = useState(true);

    // Modal Crear/Ver Presupuesto
    const [modalCrearOpen, setModalCrearOpen] = useState(false);
    const [modalVerOpen, setModalVerOpen] = useState(false);
    const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState(null);

    // Paso activo del creador (1: Periodo, 2: Partidas)
    const [paso, setPaso] = useState(1);

    //Filtrar presupuestos por estado: todos, aprobado, borrador
    const [filtroEstado, setFiltroEstado] = useState('todos');

    // Estado local para idPeriodo (almacena el ID como NÚMERO)
    const [idPeriodo, setIdPeriodo] = useState(null);
    const [detalles, setDetalles] = useState([]);

    // Campos temporales para la partida actual
    const [partidaTemporal, setPartidaTemporal] = useState({
        id_categoria: '',
        monto_asignado: '',
        descripcion: ''
    });

    useEffect(() => {
        cargarDatosIniciales();
    }, []);

    const getId = (obj, keys = ['id', 'Id', 'id_periodo', 'Id_Periodo', 'id_categoria', 'Id_Categoria']) => {
        if (!obj) return null;
        const key = keys.find(k => obj[k] !== undefined && obj[k] !== null);
        return key ? Number(obj[key]) : null;
    };

    // Helper único y directo para obtener ID numérico del periodo
    const obtenerIdPeriodo = (p) => {
        if (!p) return null;
        const val = p.Id_Periodos ?? p.id_periodo ?? p.Id_Periodo ?? p.id ?? p.Id;
        if (val === undefined || val === null) return null;
        const num = Number(val);
        return Number.isNaN(num) ? null : num;
    };

    const getNombrePeriodo = (p) => {
        if (!p) return 'Periodo no especificado';
        return p.nombre || p.Nombre || p.descripcion || p.Descripcion || `Periodo Fiscal #${obtenerIdPeriodo(p)}`;
    };

    const obtenerIdCategoria = (c) => {
        if (!c) return null;
        const val = c.id_categoria ?? c.Id_Categoria ?? c.id ?? c.Id;
        return val !== undefined && val !== null ? Number(val) : null;
    };

    const getNombreCategoria = (id) => {
        const cat = categorias.find((c) => obtenerIdCategoria(c) === Number(id));
        return cat ? (cat.Nombre || cat.nombre || `Categoría #${id}`) : `Categoría #${id}`;
    };

    const cargarDatosIniciales = async () => {
        setCargando(true);
        try {
            const [resPresupuestos, resPeriodos, resCategorias] = await Promise.all([
                api.get('/presupuesto').catch(() => ({ data: [] })),
                api.get('/periodos-fiscales').catch(() => api.get('/periodo')).catch(() => ({ data: [] })),
                api.get('/categoria-gasto').catch(() => ({ data: [] }))
            ]);

            const listaPresupuestos = Array.isArray(resPresupuestos.data) ? resPresupuestos.data : resPresupuestos.data?.data || [];
            const listaPeriodos = Array.isArray(resPeriodos.data) ? resPeriodos.data : resPeriodos.data?.data || [];
            const listaCategorias = Array.isArray(resCategorias.data) ? resCategorias.data : resCategorias.data?.data || [];

            setPresupuestos(listaPresupuestos);
            setPeriodos(listaPeriodos);
            setCategorias(listaCategorias);
        } catch (error) {
            console.error("Error al cargar datos:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error de carga',
                text: 'No se pudieron obtener los datos iniciales.'
            });
        } finally {
            setCargando(false);
        }
    };

    const handleResetForm = () => {
        const primerPeriodo = periodos.length > 0 ? obtenerIdPeriodo(periodos[0]) : null;
        setIdPeriodo(primerPeriodo);
        setDetalles([]);
        setPartidaTemporal({ id_categoria: '', monto_asignado: '', descripcion: '' });
        setPaso(1);
    };

    const handleAbrirCrear = () => {
        handleResetForm();
        setModalCrearOpen(true);
    };

    const handleAgregarPartida = (e) => {
        e.preventDefault();
        if (!partidaTemporal.id_categoria || !partidaTemporal.monto_asignado || !partidaTemporal.descripcion) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos incompletos',
                text: 'Por favor completa todos los campos de la partida.',
                confirmColor: '#059669'
            });
            return;
        }

        const nuevaPartida = {
            id_categoria: parseInt(partidaTemporal.id_categoria, 10),
            monto_asignado: parseFloat(partidaTemporal.monto_asignado),
            descripcion: partidaTemporal.descripcion
        };

        setDetalles([...detalles, nuevaPartida]);
        setPartidaTemporal({ id_categoria: '', monto_asignado: '', descripcion: '' });
    };

    const handleEliminarPartida = (index) => {
        setDetalles(detalles.filter((_, i) => i !== index));
    };

    const handleGuardarPresupuesto = async () => {
        const parsedIdPeriodo = Number(idPeriodo);

        if (!parsedIdPeriodo || isNaN(parsedIdPeriodo) || parsedIdPeriodo <= 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Periodo no válido',
                text: 'Por favor selecciona un periodo fiscal válido.',
                confirmColor: '#059669'
            });
            return;
        }

        if (detalles.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Sin partidas',
                text: 'Debes agregar al menos una partida antes de guardar.',
                confirmColor: '#059669'
            });
            return;
        }

        const payload = {
            id_periodo: parsedIdPeriodo,
            detalles: detalles.map((d) => ({
                id_categoria: parseInt(d.id_categoria, 10),
                monto_asignado: parseFloat(d.monto_asignado),
                descripcion: d.descripcion
            }))
        };

        try {
            await api.post('/presupuesto', payload);
            setModalCrearOpen(false);
            Swal.fire({
                icon: 'success',
                title: '¡Guardado!',
                text: 'El presupuesto ha sido registrado correctamente.',
                timer: 2000,
                showConfirmButton: false
            });
            cargarDatosIniciales();
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error al guardar',
                text: error.response?.data?.message || error.message
            });
        }
    };

    const totalCalculado = detalles.reduce((acc, curr) => acc + (curr.monto_asignado || 0), 0);

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto || 0);
    };

    // Función para eliminar una partida individual desde el modal de detalle
    const handleEliminarDetalle = async (idDetalle) => {
        if (!idDetalle) {
            Swal.fire({
                icon: 'warning',
                title: 'Error',
                text: 'No se encontró el ID de la partida a eliminar.'
            });
            return;
        }

        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "¿Deseas eliminar esta partida presupuestaria?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;

        try {
            await api.delete(`/presupuesto/detalle/${idDetalle}`);

            const nuevosDetalles = presupuestoSeleccionado.detalles.filter(
                (d) => getId(d, ['id_detalle', 'Id_Detalle', 'id', 'Id']) !== idDetalle
            );

            const presupuestoActualizado = {
                ...presupuestoSeleccionado,
                detalles: nuevosDetalles
            };

            setPresupuestoSeleccionado(presupuestoActualizado);

            setPresupuestos(prev => prev.map(p => {
                const idPres = getId(p, ['id_presupuesto', 'Id_Presupuesto', 'id', 'Id']);
                const idPresSel = getId(presupuestoSeleccionado, ['id_presupuesto', 'Id_Presupuesto', 'id', 'Id']);
                return idPres === idPresSel ? presupuestoActualizado : p;
            }));

            Swal.fire({
                icon: 'success',
                title: 'Eliminada',
                text: 'La partida ha sido eliminada con éxito.',
                timer: 1800,
                showConfirmButton: false
            });

        } catch (error) {
            console.error("Error al eliminar la partida:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error al eliminar',
                text: error.response?.data?.message || error.message
            });
        }
    };
const handleToggleAprobar = async (presupuesto, debeAprobar) => {
    if (!presupuesto) return;

    // Obtenemos el ID del presupuesto dinámicamente
    const idPresupuesto = presupuesto.id_presupuesto || presupuesto.Id_Presupuesto || presupuesto.id || presupuesto.Id;
    const nuevoEstado = debeAprobar ? "aprobado" : "borrador";

    try {
        // Petición PUT con Axios
        await api.put(`/presupuesto/${idPresupuesto}`, {
            Estado: nuevoEstado
        });

        // Actualizamos el estado del modal localmente
        setPresupuestoSeleccionado(prev => ({
            ...prev,
            Estado: nuevoEstado,
            estado: nuevoEstado
        }));

        // Actualizamos la lista principal si existe
        if (typeof setPresupuestos === 'function') {
            setPresupuestos(prev => 
                prev.map(p => {
                    const idP = p.id_presupuesto || p.Id_Presupuesto || p.id || p.Id;
                    return Number(idP) === Number(idPresupuesto) 
                        ? { ...p, Estado: nuevoEstado, estado: nuevoEstado } 
                        : p;
                })
            );
        }

    } catch (error) {
        console.error("Error al actualizar el estado del presupuesto:", error);
    }
};
    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-slate-50/50 dark:bg-slate-950">
            {/* Encabezado Principal */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Gestión de Presupuestos
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Planeación, distribución y control presupuestal por periodo fiscal.
                    </p>
                </div>

                <Button 
                    onClick={handleAbrirCrear}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-600/20 rounded-xl px-5 py-6 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                    Nuevo Presupuesto
                </Button>
            </div>
            

            {/* Listado Principal */}
            {cargando ? (
                <div className="text-center py-20 text-slate-400">Cargando datos...</div>
            ) : presupuestos.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                    <p className="text-slate-500 font-medium">No hay presupuestos cargados aún.</p>
                    <Button variant="link" onClick={handleAbrirCrear} className="text-emerald-600 mt-2">
                        + Crear el primero
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {presupuestos.map((item, idx) => (
                        <motion.div 
                            key={idx}
                            whileHover={{ y: -4 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                            onClick={() => { setPresupuestoSeleccionado(item); setModalVerOpen(true); }}
                        >
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                        Periodo #{item.id_periodo || item.Id_Periodo || item.Id_Periodos}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {item.detalles?.length || 0} partidas
                                    </span>
                                </div>
                                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">
                                    {item.periodo?.Nombre || item.periodo?.nombre || `Presupuesto Fiscal`}
                                </h3>
                                <p className="text-3xl font-black text-slate-900 dark:text-white mt-4">
                                    {formatearMoneda(
                                        item.detalles?.reduce((a, b) => a + Number(b.monto_asignado || b.Monto_Asignado || 0), 0) || item.Monto_Aprobado
                                    )}
                                </p>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-emerald-600 font-semibold">
                                <span>Ver desglose completo</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
            {/* ================= MODAL CREAR ================= */}
<Dialog open={modalCrearOpen} onOpenChange={setModalCrearOpen}>
    <DialogContent className="!max-w-[850px] !w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border-none shadow-2xl">
        {/* Encabezado Fijo */}
        <div className="bg-slate-900 text-white p-6 shrink-0">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Crear Nuevo Presupuesto</h2>
                <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
                    Paso {paso} de 2
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div className={`p-3 rounded-lg border flex items-center gap-2 ${paso === 1 ? 'border-emerald-500 bg-emerald-50/10 text-emerald-400' : 'border-slate-800 text-slate-500'}`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${paso === 1 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>1</span>
                    Seleccionar Periodo
                </div>
                <div className={`p-3 rounded-lg border flex items-center gap-2 ${paso === 2 ? 'border-emerald-500 bg-emerald-50/10 text-emerald-400' : 'border-slate-800 text-slate-500'}`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${paso === 2 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>2</span>
                    Cargar Partidas ({detalles.length})
                </div>
            </div>
        </div>

        {/* Cuerpo con Scroll Vertical — min-h-0 es la clave: sin esto, este div
            nunca se encoge y el contenido se recorta en vez de hacer scroll */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 min-h-0">
            <AnimatePresence mode="wait">
                {paso === 1 && (
                    <motion.div
                        key="paso1"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-4 py-2"
                    >
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                            Selecciona el Periodo Fiscal:
                        </label>

                        {periodos.length > 0 ? (
                            <div className="space-y-4">
                                <select
                                    className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                                    value={idPeriodo ?? ''}
                                    onChange={(e) => setIdPeriodo(Number(e.target.value))}
                                >
                                    <option value="" disabled>-- Elige un periodo fiscal --</option>
                                    {periodos.map((p) => {
                                        const idP = obtenerIdPeriodo(p);
                                        return (
                                            <option key={idP} value={idP}>
                                                {getNombrePeriodo(p)} (ID: {idP})
                                            </option>
                                        );
                                    })}
                                </select>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1">
                                    {periodos.map((p) => {
                                        const idP = obtenerIdPeriodo(p);
                                        const esSeleccionado = idPeriodo !== null && Number(idPeriodo) === Number(idP);
                                        return (
                                            <div
                                                key={idP}
                                                onClick={() => setIdPeriodo(Number(idP))}
                                                className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                                                    esSeleccionado
                                                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm ring-1 ring-emerald-500'
                                                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                                                }`}
                                            >
                                                <div className="truncate pr-2">
                                                    <p className="font-bold text-sm text-slate-800 dark:text-white truncate" title={getNombrePeriodo(p)}>
                                                        {getNombrePeriodo(p)}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                        ID del Periodo: <span className="font-mono">{idP}</span>
                                                    </p>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center ${esSeleccionado ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                                                    {esSeleccionado && <div className="w-2 h-2 rounded-full bg-white" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                                No se encontraron periodos fiscales disponibles.
                            </div>
                        )}

                        <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-slate-800">
                            <Button
                                disabled={!idPeriodo}
                                onClick={() => setPaso(2)}
                                className="bg-slate-900 text-white hover:bg-slate-800 px-8"
                            >
                                Siguiente: Agregar Partidas →
                            </Button>
                        </div>
                    </motion.div>
                )}

                {paso === 2 && (
                    <motion.div
                        key="paso2"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="space-y-6"
                    >
                        <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Nueva Partida Presupuestaria
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                <div className="md:col-span-4">
                                    <select
                                        className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                                        value={partidaTemporal.id_categoria}
                                        onChange={(e) => setPartidaTemporal({ ...partidaTemporal, id_categoria: e.target.value })}
                                    >
                                        <option value="">Selecciona Categoría...</option>
                                        {categorias.map((c) => {
                                            const idCat = obtenerIdCategoria(c);
                                            return (
                                                <option key={idCat} value={idCat}>
                                                    {c.Nombre || c.nombre || `Categoría #${idCat}`}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                <div className="md:col-span-3">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="Monto ($)"
                                        className="h-10 text-xs"
                                        value={partidaTemporal.monto_asignado}
                                        onChange={(e) => setPartidaTemporal({ ...partidaTemporal, monto_asignado: e.target.value })}
                                    />
                                </div>

                                <div className="md:col-span-5">
                                    <Input
                                        placeholder="Descripción detallada..."
                                        className="h-10 text-xs"
                                        value={partidaTemporal.descripcion}
                                        onChange={(e) => setPartidaTemporal({ ...partidaTemporal, descripcion: e.target.value })}
                                    />
                                </div>

                                <div className="md:col-span-12 flex justify-end">
                                    <Button
                                        type="button"
                                        onClick={handleAgregarPartida}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-6 h-9"
                                    >
                                        + Añadir Item a la Lista
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="max-h-[260px] overflow-y-auto overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                            <Table className="w-full min-w-[650px]">
                                <TableHeader className="bg-slate-50 dark:bg-slate-950 sticky top-0 z-10">
                                    <TableRow>
                                        <TableHead className="text-xs">Categoría</TableHead>
                                        <TableHead className="text-xs">Descripción</TableHead>
                                        <TableHead className="text-xs text-right">Monto Asignado</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {detalles.length > 0 ? (
                                        detalles.map((d, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="text-xs font-bold truncate max-w-[140px]" title={getNombreCategoria(d.id_categoria)}>{getNombreCategoria(d.id_categoria)}</TableCell>
                                                <TableCell className="text-xs truncate max-w-[220px]" title={d.descripcion}>{d.descripcion}</TableCell>
                                                <TableCell className="text-xs text-right font-semibold whitespace-nowrap">{formatearMoneda(d.monto_asignado)}</TableCell>
                                                <TableCell className="text-center">
                                                    <button
                                                        onClick={() => handleEliminarPartida(index)}
                                                        className="text-red-500 hover:text-red-700 p-1 font-bold"
                                                        title="Eliminar partida"
                                                    >
                                                        ✕
                                                    </button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-xs text-slate-400">
                                                Aún no has agregado partidas. Usa el panel superior para cargar ítems.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Footer fijo — separado del área con scroll, así nunca se recorta */}
        {paso === 2 && (
            <div className="flex justify-between items-center px-6 md:px-8 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <div>
                    <p className="text-xs text-slate-400 uppercase font-bold">Total Asignado</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{formatearMoneda(totalCalculado)}</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setPaso(1)}>
                        ← Volver a Periodo
                    </Button>
                    <Button
                        disabled={detalles.length === 0}
                        onClick={handleGuardarPresupuesto}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6"
                    >
                        Guardar Presupuesto
                    </Button>
                </div>
            </div>
        )}
    </DialogContent>
</Dialog>

{/* ================= MODAL VISTA DETALLADA ================= */}
<Dialog open={modalVerOpen} onOpenChange={setModalVerOpen}>
    <DialogContent className="!max-w-[680px] !w-[90vw] max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl p-0 overflow-hidden flex flex-col border-none shadow-2xl">
        {presupuestoSeleccionado && (() => {
            // Evaluamos correctamente usando presupuestoSeleccionado
            const estadoTexto = presupuestoSeleccionado?.Estado || presupuestoSeleccionado?.estado || '';
            const estaAprobado = estadoTexto.toLowerCase() === "aprobado";

            return (
                <>
                    {/* Header y Cuerpo de la Tabla */}
                    <div className="p-5 md:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-between items-start shrink-0">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                                    Periodo #{presupuestoSeleccionado.id_periodo || presupuestoSeleccionado.Id_Periodo}
                                </span>
                                
                                {/* Badge de Estado */}
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                    estaAprobado 
                                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' 
                                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                }`}>
                                    {estaAprobado ? '● Aprobado' : '○ Pendiente'}
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1.5 leading-tight">
                                {presupuestoSeleccionado.periodo?.Nombre || presupuestoSeleccionado.periodo?.nombre || 'Detalle del Presupuesto'}
                            </h2>
                        </div>

                        <div className="text-right">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Presupuestado</span>
                            <span className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                                {formatearMoneda(
                                    presupuestoSeleccionado.detalles?.reduce((a, b) => a + Number(b.monto_asignado || b.Monto_Asignado || 0), 0) || presupuestoSeleccionado.Monto_Aprobado
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Tabla de Partidas con Scroll Interno */}
                    <div className="p-5 md:p-6 flex-1 overflow-y-auto">
                        <div className="max-h-[280px] overflow-y-auto overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                            <Table className="w-full text-xs">
                                <TableHeader className="bg-slate-100 dark:bg-slate-950 sticky top-0 z-10">
                                    <TableRow className="h-8">
                                        <TableHead className="text-[11px] h-8 py-1">Categoría</TableHead>
                                        <TableHead className="text-[11px] h-8 py-1">Descripción</TableHead>
                                        <TableHead className="text-[11px] h-8 py-1 text-right">Monto</TableHead>
                                        <TableHead className="w-[35px] h-8 py-1"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {presupuestoSeleccionado.detalles && presupuestoSeleccionado.detalles.length > 0 ? (
                                        presupuestoSeleccionado.detalles.map((d, index) => {
                                            const idDetalle = getId(d, ['id_detalle', 'Id_Detalle', 'id', 'Id']);
                                            return (
                                                <TableRow key={index} className="h-8">
                                                    <TableCell className="py-1.5 font-bold">{getNombreCategoria(d.id_categoria || d.Id_Categoria)}</TableCell>
                                                    <TableCell className="py-1.5 text-slate-500 truncate max-w-[200px]">{d.descripcion || d.Descripcion || 'Sin descripción'}</TableCell>
                                                    <TableCell className="py-1.5 text-right font-semibold">{formatearMoneda(d.monto_asignado || d.Monto_Asignado)}</TableCell>
                                                    <TableCell className="py-1.5 text-center">
                                                        <button 
                                                            onClick={() => handleEliminarDetalle(idDetalle)}
                                                            className="text-slate-400 hover:text-red-500 transition-colors p-0.5"
                                                            title="Eliminar partida"
                                                        >
                                                            ✕
                                                        </button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-6 text-slate-400 text-xs">
                                                No hay partidas asignadas.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Footer con Botón Dinámico de Aprobación */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                        <Button 
                            onClick={() => handleToggleAprobar(presupuestoSeleccionado, !estaAprobado)}
                            className={`font-semibold text-xs px-5 h-9 rounded-lg flex items-center gap-2 shadow-sm transition-all active:scale-95 text-white ${
                                estaAprobado 
                                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20' 
                                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                            }`}
                        >
                            {estaAprobado ? (
                                <>
                                    <span>✕</span> Desaprobar Presupuesto
                                </>
                            ) : (
                                <>
                                    <span>✓</span> Aprobar Presupuesto
                                </>
                            )}
                        </Button>

                        <Button 
                            variant="outline" 
                            onClick={() => setModalVerOpen(false)}
                            className="h-9 text-xs px-4 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900"
                        >
                            Cerrar
                        </Button>
                    </div>
                </>
            );
        })()}
    </DialogContent>
</Dialog>

        </div>
    );
}

export default PresupuestosManager;