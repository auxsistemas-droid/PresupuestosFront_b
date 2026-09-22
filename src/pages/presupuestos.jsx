import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { motion, AnimatePresence } from "framer-motion";
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
            alert("Completa todos los campos de la partida.");
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
            alert("Por favor selecciona un periodo fiscal válido.");
            return;
        }

        if (detalles.length === 0) {
            alert("Debes agregar al menos una partida antes de guardar.");
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
            cargarDatosIniciales();
        } catch (error) {
            alert("Error al guardar presupuesto: " + (error.response?.data?.message || error.message));
        }
    };

    const totalCalculado = detalles.reduce((acc, curr) => acc + (curr.monto_asignado || 0), 0);

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto || 0);
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

            {/* ================= MODAL CREAR (ANCHO FORZADO A 850px) ================= */}
            <Dialog open={modalCrearOpen} onOpenChange={setModalCrearOpen}>
                <DialogContent className="!max-w-[850px] !w-[95vw] p-0 overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border-none shadow-2xl">
                    <div className="bg-slate-900 text-white p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Crear Nuevo Presupuesto</h2>
                            <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
                                Paso {paso} de 2
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                            <div className={`p-3 rounded-lg border flex items-center gap-2 ${paso === 1 ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-800 text-slate-500'}`}>
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${paso === 1 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>1</span>
                                Seleccionar Periodo
                            </div>
                            <div className={`p-3 rounded-lg border flex items-center gap-2 ${paso === 2 ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-800 text-slate-500'}`}>
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${paso === 2 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>2</span>
                                Cargar Partidas ({detalles.length})
                            </div>
                        </div>
                    </div>

                    <div className="p-6 md:p-8">
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
                                            {/* Selector Desplegable */}
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

                                            {/* Opciones en Tarjetas */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1">
                                                {periodos.map((p) => {
                                                    const idP = obtenerIdPeriodo(p);
                                                    // Comparación estricta por número
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
                                                            <div>
                                                                <p className="font-bold text-sm text-slate-800 dark:text-white">
                                                                    {getNombrePeriodo(p)}
                                                                </p>
                                                                <p className="text-xs text-slate-400 mt-0.5">
                                                                    ID del Periodo: <span className="font-mono">{idP}</span>
                                                                </p>
                                                            </div>
                                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${esSeleccionado ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
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
                                            <TableHeader className="bg-slate-50 dark:bg-slate-950 sticky top-0">
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
                                                            <TableCell className="text-xs font-bold">{getNombreCategoria(d.id_categoria)}</TableCell>
                                                            <TableCell className="text-xs">{d.descripcion}</TableCell>
                                                            <TableCell className="text-xs text-right font-semibold">{formatearMoneda(d.monto_asignado)}</TableCell>
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

                                    <div className="flex justify-between items-center pt-4 border-t">
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
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ================= MODAL VISTA DETALLADA (ANCHO FORZADO A 750px) ================= */}
            <Dialog open={modalVerOpen} onOpenChange={setModalVerOpen}>
                <DialogContent className="!max-w-[750px] !w-[90vw] bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8">
                    {presupuestoSeleccionado && (
                        <div>
                            <div className="border-b pb-4 mb-6">
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                                    Periodo #{presupuestoSeleccionado.id_periodo || presupuestoSeleccionado.Id_Periodo}
                                </span>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                    Desglose de Presupuesto
                                </h2>
                            </div>

                            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2">
                                {(presupuestoSeleccionado.detalles || []).map((det, i) => (
                                    <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center gap-4">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                                {getNombreCategoria(det.id_categoria || det.Id_Categoria)}
                                            </span>
                                            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-2">
                                                {det.descripcion || det.Descripcion}
                                            </p>
                                        </div>
                                        <p className="font-bold text-base text-slate-900 dark:text-white whitespace-nowrap">
                                            {formatearMoneda(det.monto_asignado || det.Monto_Asignado)}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 pt-4 border-t flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase">Total del Presupuesto</p>
                                    <p className="text-xl font-black text-slate-900 dark:text-white">
                                        {formatearMoneda(
                                            presupuestoSeleccionado.detalles?.reduce((a, b) => a + Number(b.monto_asignado || b.Monto_Asignado || 0), 0)
                                        )}
                                    </p>
                                </div>
                                <Button variant="outline" onClick={() => setModalVerOpen(false)}>
                                    Cerrar
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default PresupuestosManager;