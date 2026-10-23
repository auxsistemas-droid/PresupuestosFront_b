import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import api from "../api/axios";

/* =====================================================================
   CONSTANTES
   ===================================================================== */

// Mismos valores que PRESUPUESTOS.Estado en la BD
const ESTADOS = {
  ENVIADO: "enviado",
  EN_REVISION: "en_revision",
  APROBADO: "aprobado",
  RECHAZADO: "rechazado",
};

// Etiqueta (tab) y color (badge) de cada estado
const CONFIG_ESTADO = {
  [ESTADOS.ENVIADO]: {
    tab: "Enviados",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  [ESTADOS.EN_REVISION]: {
    tab: "En Revisión",
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  [ESTADOS.APROBADO]: {
    tab: "Aprobados",
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  [ESTADOS.RECHAZADO]: {
    tab: "Rechazados",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  },
};

const TABS = [
  ...Object.entries(CONFIG_ESTADO).map(([id, { tab }]) => ({ id, label: tab })),
  { id: "todos", label: "Todos" },
];

const getBadgeEstado = (estado) =>
  CONFIG_ESTADO[estado]?.badge || "bg-slate-100 text-slate-600";

// Color del botón según el estado al que lleva
const CLASE_BOTON = {
  [ESTADOS.EN_REVISION]:
    "text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40",
  [ESTADOS.APROBADO]:
    "text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40",
  [ESTADOS.RECHAZADO]:
    "text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40",
};

// Botones de cada tarjeta. "Aprobar" no cambia el estado directo: abre el modal.
const ACCIONES_POR_ESTADO = {
  [ESTADOS.ENVIADO]: [
    { estado: ESTADOS.EN_REVISION, label: "En revisión" },
    { estado: ESTADOS.RECHAZADO, label: "Rechazar" },
  ],
  [ESTADOS.EN_REVISION]: [
    { estado: ESTADOS.APROBADO, label: "Revisar / Aprobar" },
    { estado: ESTADOS.RECHAZADO, label: "Rechazar" },
  ],
  [ESTADOS.RECHAZADO]: [{ estado: ESTADOS.EN_REVISION, label: "En revisión" }],
  [ESTADOS.APROBADO]: [{ estado: ESTADOS.EN_REVISION, label: "Reabrir" }],
};

/* =====================================================================
   HELPERS
   ===================================================================== */

const formatearMoneda = (monto) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    monto || 0,
  );

const obtenerMensajeError = (
  error,
  porDefecto = "No se pudo completar la acción.",
) => {
  const msg = error?.response?.data?.message;
  return Array.isArray(msg) ? msg.join(", ") : msg || porDefecto;
};

// Swal con los botones de confirmar/cancelar ya configurados
const confirmar = (opciones) =>
  Swal.fire({
    showCancelButton: true,
    cancelButtonText: "Cancelar",
    ...opciones,
  });

// Devuelve el primer valor existente entre varios nombres posibles (Pascal/camel)
const leer = (obj, ...keys) => {
  const key = keys.find((k) => obj?.[k] !== undefined && obj?.[k] !== null);
  return key ? obj[key] : undefined;
};

/**
 * Convierte un registro del backend a una forma única y simple.
 * Se hace UNA vez al cargar; el resto del componente ya no se preocupa
 * por mayúsculas/minúsculas ni por campos faltantes.
 *
 * Solicitado = DETALLE.Monto_Asignado (nunca se modifica)
 * Aprobado   = DETALLE.Monto_Aprobado (null mientras no se apruebe)
 */
const normalizarDetalle = (d) => {
  const aprobado = leer(d, "Monto_Aprobado", "monto_aprobado");
  return {
    id: leer(d, "Id_Detalle", "id_detalle"),
    idCategoria: leer(d, "Id_Categoria", "id_categoria"),
    descripcion: leer(d, "Descripcion", "descripcion") || "Sin descripción",
    solicitado: Number(leer(d, "Monto_Asignado", "monto_asignado") ?? 0),
    aprobado: aprobado === undefined ? null : Number(aprobado),
  };
};

const normalizarPresupuesto = (p) => {
  const detalles = (leer(p, "detalles", "Detalles") ?? []).map(
    normalizarDetalle,
  );

  // El total solicitado sale del encabezado; si no existe, de la suma de partidas
  const solicitadoEncabezado = Number(
    leer(p, "Monto_Solicitado", "monto_solicitado") ?? 0,
  );
  const solicitadoPartidas = detalles.reduce((a, d) => a + d.solicitado, 0);

  return {
    id: leer(p, "Id_Presupuesto", "id_presupuesto", "id"),
    idPeriodo: leer(p, "Id_Periodo", "id_periodo"),
    estado: String(
      leer(p, "Estado", "estado") ?? ESTADOS.EN_REVISION,
    ).toLowerCase(),
    periodo: p?.periodo?.Nombre || p?.Periodo || "Presupuesto Fiscal",
    departamento: p?.Departamento || p?.departamento?.Nombre,
    comentario: leer(p, "Comentario_Revision", "comentario_revision") || "",
    totalSolicitado:
      solicitadoEncabezado > 0 ? solicitadoEncabezado : solicitadoPartidas,
    totalAprobado: Number(leer(p, "Monto_Aprobado", "monto_aprobado") ?? 0),
    detalles,
  };
};

// Totales y validaciones de las partidas que se están editando en el modal
const calcularTotales = (detalles) => {
  const solicitado = detalles.reduce((a, d) => a + d.solicitado, 0);
  const autorizado = detalles.reduce((a, d) => a + d.aprobado, 0);
  return {
    solicitado,
    autorizado,
    diferencia: autorizado - solicitado,
    hayExcedente: detalles.some((d) => d.aprobado > d.solicitado),
    hayNegativos: detalles.some((d) => d.aprobado < 0),
  };
};

/* =====================================================================
   TARJETA
   ===================================================================== */

function TarjetaPresupuesto({ presupuesto: p, onAbrir, onAccion }) {
  const esAprobado = p.estado === ESTADOS.APROBADO;
  const diferencia = p.totalAprobado - p.totalSolicitado;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
      onClick={() => onAbrir(p)}
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            Periodo #{p.idPeriodo}
          </span>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getBadgeEstado(p.estado)}`}
          >
            {p.estado.replace("_", " ")}
          </span>
        </div>

        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">
          {p.periodo}
        </h3>
        {p.departamento && (
          <p className="text-xs text-slate-500">{p.departamento}</p>
        )}

        <div className="mt-4">
          {esAprobado ? (
            <>
              <p className="text-3xl font-black text-slate-900 dark:text-white">
                {formatearMoneda(p.totalAprobado)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Solicitado:{" "}
                <span className="line-through">
                  {formatearMoneda(p.totalSolicitado)}
                </span>
                {diferencia !== 0 && (
                  <span
                    className={`ml-2 font-bold ${diferencia < 0 ? "text-rose-500" : "text-emerald-500"}`}
                  >
                    {diferencia > 0 ? "+" : ""}
                    {formatearMoneda(diferencia)}
                  </span>
                )}
              </p>
            </>
          ) : (
            <>
              <p className="text-3xl font-black text-slate-900 dark:text-white">
                {formatearMoneda(p.totalSolicitado)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Monto solicitado</p>
            </>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {p.detalles.length} partidas registradas
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-xs text-emerald-600 font-semibold hover:underline">
          {p.estado === ESTADOS.EN_REVISION ? "Ver / Ajustar" : "Ver detalle"}
        </span>

        <div className="flex gap-2">
          {ACCIONES_POR_ESTADO[p.estado]?.map(({ estado, label }) => (
            <button
              key={estado}
              onClick={(e) => {
                e.stopPropagation();
                onAccion(p, estado);
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${CLASE_BOTON[estado]}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* =====================================================================
   MODAL
   ===================================================================== */

function ModalRevision({
  presupuesto,
  detalles,
  totales,
  comentario,
  guardando,
  nombreCategoria,
  onMontoChange,
  onComentarioChange,
  onCerrar,
  onRechazar,
  onAprobar,
}) {
  const soloLectura = presupuesto.estado !== ESTADOS.EN_REVISION;
  const { solicitado, autorizado, diferencia, hayExcedente, hayNegativos } =
    totales;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
              Periodo #{presupuesto.idPeriodo}
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              Evaluación de Presupuesto
            </h2>
            <span
              className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${getBadgeEstado(presupuesto.estado)}`}
            >
              {presupuesto.estado}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Solicitado vs Autorizado
            </span>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-xs text-slate-400 line-through">
                {formatearMoneda(solicitado)}
              </span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {formatearMoneda(autorizado)}
              </span>
            </div>
            {diferencia !== 0 && (
              <span
                className={`text-[10px] font-bold ${diferencia < 0 ? "text-rose-500" : "text-amber-500"}`}
              >
                {diferencia < 0
                  ? `Ajuste: ${formatearMoneda(diferencia)}`
                  : `+${formatearMoneda(diferencia)}`}
              </span>
            )}
          </div>
        </div>

        {/* Partidas */}
        <div className="overflow-y-auto flex-1 min-h-0 space-y-2 pr-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            {soloLectura
              ? "Partidas"
              : "Partidas solicitadas (puedes ajustar el monto a aprobar)"}
          </p>

          {detalles.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              No se encontraron partidas para este presupuesto.
            </div>
          ) : (
            detalles.map((det, i) => {
              const dif = det.aprobado - det.solicitado;
              const excede = dif > 0;
              return (
                <div
                  key={det.id ?? i}
                  className="grid grid-cols-12 gap-3 items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800"
                >
                  <div className="col-span-6">
                    <p className="font-bold text-xs text-slate-800 dark:text-white truncate">
                      {nombreCategoria(det.idCategoria)}
                    </p>
                    <p
                      className="text-[11px] text-slate-500 truncate"
                      title={det.descripcion}
                    >
                      {det.descripcion}
                    </p>
                  </div>

                  <div className="col-span-3 text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                      Solicitado
                    </span>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {formatearMoneda(det.solicitado)}
                    </span>
                  </div>

                  <div className="col-span-3">
                    <label className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block uppercase">
                      {soloLectura ? "Aprobado" : "Aprobar ($)"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={det.solicitado}
                      disabled={soloLectura}
                      value={det.aprobado}
                      onChange={(e) => onMontoChange(i, e.target.value)}
                      className={`w-full h-8 px-2 text-xs font-bold text-right rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 disabled:opacity-70 ${
                        excede
                          ? "border-rose-400 focus:ring-rose-500"
                          : "border-emerald-300 dark:border-emerald-800 focus:ring-emerald-500"
                      }`}
                    />
                    {dif !== 0 && (
                      <span
                        className={`text-[10px] font-bold block text-right mt-0.5 ${excede ? "text-rose-500" : "text-amber-500"}`}
                      >
                        {dif > 0 ? "+" : ""}
                        {formatearMoneda(dif)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {hayExcedente && !soloLectura && (
            <p className="text-[11px] text-rose-500 font-semibold">
              No puedes aprobar más de lo solicitado en una partida.
            </p>
          )}

          <div className="pt-2">
            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
              Comentario de revisión
            </label>
            <textarea
              rows={2}
              maxLength={300}
              disabled={soloLectura}
              value={comentario}
              onChange={(e) => onComentarioChange(e.target.value)}
              placeholder={
                soloLectura
                  ? "Sin comentarios"
                  : "Opcional: justifica los ajustes realizados"
              }
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 disabled:opacity-70 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            Cerrar
          </button>

          {!soloLectura && (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={guardando}
                onClick={onRechazar}
                className="px-4 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 rounded-xl transition-colors"
              >
                Rechazar presupuesto
              </button>

              <button
                type="button"
                disabled={guardando || hayExcedente || hayNegativos}
                onClick={onAprobar}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-emerald-600/20 transition-all"
              >
                {guardando ? "Guardando..." : "✓ Aprobar presupuesto"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
   PÁGINA
   ===================================================================== */

function Revision() {
  const [presupuestos, setPresupuestos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState(ESTADOS.EN_REVISION);

  // Estado del modal
  const [seleccionado, setSeleccionado] = useState(null);
  const [detallesEditables, setDetallesEditables] = useState([]);
  const [comentario, setComentario] = useState("");
  const [guardando, setGuardando] = useState(false);

  /* ---------- Carga de datos ---------- */

  const cargarPresupuestos = async () => {
    const { data } = await api.get("/presupuesto");
    setPresupuestos((data || []).map(normalizarPresupuesto));
  };

  useEffect(() => {
    const cargarInicial = async () => {
      try {
        const [, resCategorias] = await Promise.all([
          cargarPresupuestos(),
          api.get("/categoria-gasto"),
        ]);
        setCategorias(resCategorias.data || []);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        Swal.fire(
          "Error",
          "No se pudieron cargar los datos iniciales.",
          "error",
        );
      } finally {
        setCargando(false);
      }
    };
    cargarInicial();
  }, []);

  const nombreCategoria = (id) => {
    const cat = categorias.find(
      (c) => Number(leer(c, "Id_Categoria", "id_categoria")) === Number(id),
    );
    return leer(cat, "Nombre", "nombre") || `Categoría #${id}`;
  };

  /* ---------- Modal ---------- */

  const abrirModal = (presupuesto) => {
    setSeleccionado(presupuesto);
    setComentario(presupuesto.comentario);
    // Si ya fue aprobado muestra lo aprobado; si no, parte de lo solicitado
    setDetallesEditables(
      presupuesto.detalles.map((d) => ({
        ...d,
        aprobado: d.aprobado ?? d.solicitado,
      })),
    );
  };

  const cerrarModal = () => setSeleccionado(null);

  const cambiarMonto = (index, valor) => {
    setDetallesEditables((prev) =>
      prev.map((d, i) =>
        i === index ? { ...d, aprobado: parseFloat(valor) || 0 } : d,
      ),
    );
  };

  const totales = calcularTotales(detallesEditables);

  /* ---------- Operaciones (todas pasan por PATCH /revision) ---------- */

  const revisar = (id, payload) =>
    api.patch(`/presupuesto/${id}/revision`, payload);

  // Ejecuta la acción, recarga la lista y avisa. Devuelve true si salió bien.
  const ejecutar = async (accion, mensajeExito) => {
    try {
      await accion();
      await cargarPresupuestos();
      if (mensajeExito) Swal.fire("Listo", mensajeExito, "success");
      return true;
    } catch (error) {
      Swal.fire("Error", obtenerMensajeError(error), "error");
      return false;
    }
  };

  const rechazar = async (presupuesto) => {
    const { isConfirmed, value } = await confirmar({
      title: "Rechazar presupuesto",
      input: "textarea",
      inputLabel: "Motivo del rechazo",
      inputPlaceholder: "Explica qué debe corregirse…",
      inputAttributes: { maxlength: 300 },
      confirmButtonText: "Rechazar",
      confirmButtonColor: "#e11d48",
      inputValidator: (v) =>
        !v?.trim() ? "Indica el motivo del rechazo." : null,
    });
    if (!isConfirmed) return false;

    return ejecutar(
      () =>
        revisar(presupuesto.id, {
          estado: ESTADOS.RECHAZADO,
          comentario: value.trim(),
        }),
      "Presupuesto rechazado.",
    );
  };

  const cambiarEstado = async (presupuesto, nuevoEstado) => {
    if (presupuesto.estado === ESTADOS.APROBADO) {
      const { isConfirmed } = await confirmar({
        title: "¿Reabrir presupuesto?",
        text: "Se descartarán los montos aprobados.",
        icon: "warning",
        confirmButtonText: "Reabrir",
      });
      if (!isConfirmed) return;
    }
    ejecutar(() => revisar(presupuesto.id, { estado: nuevoEstado }));
  };

  // Botones de la tarjeta: aprobar abre el modal, el resto cambia el estado
  const manejarAccion = (presupuesto, estado) => {
    if (estado === ESTADOS.APROBADO) return abrirModal(presupuesto);
    if (estado === ESTADOS.RECHAZADO) return rechazar(presupuesto);
    return cambiarEstado(presupuesto, estado);
  };

  const rechazarDesdeModal = async () => {
    if (await rechazar(seleccionado)) cerrarModal();
  };

  // El botón ya está deshabilitado con montos inválidos y el backend los valida también
  const aprobar = async () => {
    const { isConfirmed } = await confirmar({
      title: "¿Aprobar presupuesto?",
      text: `Autorizado: ${formatearMoneda(totales.autorizado)} · Solicitado: ${formatearMoneda(totales.solicitado)}`,
      icon: "question",
      confirmButtonText: "Aprobar",
      confirmButtonColor: "#059669",
    });
    if (!isConfirmed) return;

    setGuardando(true);
    const ok = await ejecutar(
      () =>
        revisar(seleccionado.id, {
          estado: ESTADOS.APROBADO,
          comentario: comentario.trim() || undefined,
          detalles: detallesEditables.map((d) => ({
            id_detalle: d.id,
            monto_aprobado: d.aprobado,
          })),
        }),
      "Presupuesto aprobado.",
    );
    setGuardando(false);
    if (ok) cerrarModal();
  };

  /* ---------- Render ---------- */

  const presupuestosFiltrados = presupuestos.filter(
    (p) =>
      p.estado !== "borrador" &&
      (filtroEstado === "todos" || p.estado === filtroEstado),
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Revisión de Presupuestos
          </h1>
          <p className="text-sm text-slate-500">
            Evalúa, autoriza montos y dicta resoluciones sobre las solicitudes
            presupuestales.
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFiltroEstado(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filtroEstado === tab.id
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Listado */}
      {cargando ? (
        <div className="text-center py-20 text-slate-400">
          Cargando datos...
        </div>
      ) : presupuestosFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <p className="text-slate-500 font-medium">
            No hay presupuestos disponibles.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presupuestosFiltrados.map((p) => (
            <TarjetaPresupuesto
              key={p.id}
              presupuesto={p}
              onAbrir={abrirModal}
              onAccion={manejarAccion}
            />
          ))}
        </div>
      )}

      {seleccionado && (
        <ModalRevision
          presupuesto={seleccionado}
          detalles={detallesEditables}
          totales={totales}
          comentario={comentario}
          guardando={guardando}
          nombreCategoria={nombreCategoria}
          onMontoChange={cambiarMonto}
          onComentarioChange={setComentario}
          onCerrar={cerrarModal}
          onRechazar={rechazarDesdeModal}
          onAprobar={aprobar}
        />
      )}
    </div>
  );
}

export default Revision;
