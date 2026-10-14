import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../api/axios'; // Asegúrate de ajustar esta ruta según tu proyecto Axios

function Revision() {
  // Estados de datos y UI
  const [presupuestos, setPresupuestos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Filtros y Modal
  const [filtroEstado, setFiltroEstado] = useState('en_revision');
  const [modalVerOpen, setModalVerOpen] = useState(false);
  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState(null);

  const [categorias, setCategorias] = useState([]);
  // Carga inicial
  useEffect(() => {
    obtenerPresupuestos();
    obtenerCategorias();
  }, []);

  const obtenerCategorias = async () => {
    try {
      const response = await api.get('/categoria-gasto');
      setCategorias(response.data || []);
    } catch (error) {
      console.error('Error al obtener categorías:', error);
    }
  };

  const obtenerPresupuestos = async () => {
    setCargando(true);
    try {
      const response = await api.get('/presupuesto');
      setPresupuestos(response.data || []);
    } catch (error) {
      console.error('Error al obtener presupuestos:', error);
    } finally {
      setCargando(false);
    }
  };

  // Formateador de moneda
  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(monto || 0);
  };

  // Función para aprobar o rechazar
  const cambiarEstado = async (presupuesto, nuevoEstado) => {
  if (!presupuesto) return;

  const idPresupuesto =
    presupuesto.id_presupuesto ||
    presupuesto.Id_Presupuesto ||
    presupuesto.id ||
    presupuesto.Id;

  try {
    // Actualizar el estado 
    await api.put(`/presupuesto/${idPresupuesto}`, {
    Estado: nuevoEstado
    });
    if (presupuestoSeleccionado) {
      setPresupuestoSeleccionado((prev) => ({
        ...prev,
        Estado: nuevoEstado,
        estado: nuevoEstado,
      }));
    }

    setPresupuestos((prev) =>
      prev.map((p) => {
        const idP = p.id_presupuesto || p.Id_Presupuesto || p.id || p.Id;
        return Number(idP) === Number(idPresupuesto)
          ? { ...p, Estado: nuevoEstado, estado: nuevoEstado }
          : p;
      })
    );
  } catch (error) {
    console.error('Error al cambiar el estado del presupuesto:', error);
    alert('Ocurrió un error al intentar actualizar el estado.');
  }
};

  // Badge según los 3 estados oficiales
  const getBadgeEstado = (estado) => {
    const est = (estado || 'en_revision').toLowerCase();
    const estilos = {
      aprobado:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      rechazado:
        'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
      en_revision:
        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    };
    return estilos[est] || 'bg-slate-100 text-slate-600';
  };

  // Texto amigable para la etiqueta visual
  const getEtiquetaEstado = (estado) => {
    const est = (estado || 'en_revision').toLowerCase();
    if (est === 'enviado') return 'Enviado';
    if (est === 'en_revision') return 'En Revisión';
    if (est === 'aprobado') return 'Aprobado';
    if (est === 'rechazado') return 'Rechazado';
    return estado;
  };

  // Filtrado reactivo en el cliente
  const presupuestosFiltrados = presupuestos.filter((item) => {
    if (filtroEstado === 'todos') return true;
    const est = (item.estado || item.Estado || 'en_revision').toLowerCase();
    return est === filtroEstado;
  });
    const obtenerIdCategoria = (c) => {
        if (!c) return null;
        const val = c.id_categoria ?? c.Id_Categoria ?? c.id ?? c.Id;
        return val !== undefined && val !== null ? Number(val) : null;
    };

    const getNombreCategoria = (id) => {
        const cat = categorias.find((c) => obtenerIdCategoria(c) === Number(id));
        return cat ? (cat.Nombre || cat.nombre || `Categoría #${id}`) : `Categoría #${id}`;
    };

    const ACCIONES_POR_ESTADO = {
    enviado: [
        { estado: 'en_revision', label: 'En revisión', clase: 'text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40' },
        { estado: 'rechazado',   label: 'Rechazar',    clase: 'text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40' },
    ],
    en_revision: [
        { estado: 'aprobado',  label: 'Aprobar',  clase: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40' },
        { estado: 'rechazado', label: 'Rechazar', clase: 'text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40' },
    ],
    rechazado: [
        { estado: 'en_revision', label: 'En revisión', clase: 'text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40' },
    ],
    aprobado: [
        { estado: 'en_revision', label: 'En revisión', clase: 'text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40' },
    ],
    };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado y Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Revisión de Presupuestos
          </h1>
          <p className="text-sm text-slate-500">
            Evalúa, aprueba o rechaza las partidas presupuestarias solicitadas.
          </p>
        </div>

        {/* Control de pestañas/filtros */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          {[
            { id: 'enviado', label: 'Enviados' },
            { id: 'en_revision', label: 'En Revisión' },
            { id: 'aprobado', label: 'Aprobados' },
            { id: 'rechazado', label: 'Rechazados' },
            { id: 'todos', label: 'Todos' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFiltroEstado(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filtroEstado === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Listado Principal */}
      {cargando ? (
        <div className="text-center py-20 text-slate-400">Cargando datos...</div>
      ) : presupuestosFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <p className="text-slate-500 font-medium">
            No hay presupuestos en la categoría "{getEtiquetaEstado(filtroEstado)}".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presupuestosFiltrados.map((item, idx) => {
            const estadoActual = item.estado || item.Estado || 'en_revision';

            return (
              <motion.div
                key={idx}
                whileHover={{ y: -4 }}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                onClick={() => {
                  setPresupuestoSeleccionado(item);
                  setModalVerOpen(true);
                }}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      Periodo #{item.id_periodo || item.Id_Periodo || item.Id_Periodos}
                    </span>

                    {/* Estado actual */}
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getBadgeEstado(
                        estadoActual
                      )}`}
                    >
                      {getEtiquetaEstado(estadoActual)}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">
                    {item.periodo?.Nombre ||
                      item.periodo?.nombre ||
                      `Presupuesto Fiscal`}
                  </h3>

                  <p className="text-3xl font-black text-slate-900 dark:text-white mt-4">
                    {formatearMoneda(
                      item.detalles?.reduce(
                        (a, b) =>
                          a + Number(b.monto_asignado || b.Monto_Asignado || 0),
                        0
                      ) || item.Monto_Aprobado
                    )}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {item.detalles?.length || 0} partidas registradas
                  </p>
                </div>

                {/* Acciones y desglose */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-emerald-600 font-semibold hover:underline">
                    Ver desglose
                  </span>

                  {/* Acciones directas */}
                  <div className="flex gap-2">
                    {(ACCIONES_POR_ESTADO[estadoActual.toLowerCase()] || []).map((accion) => (
                    <button
                    key={accion.estado}
                    onClick={(e) => {
                    e.stopPropagation();
                    cambiarEstado(item, accion.estado);
                }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${accion.clase}`}
                >
                {accion.label}
                </button>
                ))}
                </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal Desglose Rápido */}
      {modalVerOpen && presupuestoSeleccionado && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Desglose de Presupuesto {presupuestoSeleccionado.Nombre}
            </h2>
            <p className="text-sm text-slate-500">
              Periodo #{presupuestoSeleccionado.id_periodo || presupuestoSeleccionado.Id_Periodo}
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {presupuestoSeleccionado.detalles?.map((det, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm"
                >
                <span className="text-slate-700 dark:text-slate-300">
                    {getNombreCategoria(det.id_categoria || det.Id_Categoria) || det.Nombre || det.nombre || `Partida ${i + 1}`}
                </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatearMoneda(det.monto_asignado || det.Monto_Asignado)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setModalVerOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Revision;