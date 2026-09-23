import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import './../styles/Dashboard.css';
import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import api from "../api/axios";

// Componente individual arrastrable
function SortableCard({ id, className, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={className}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

export default function Dashboard() {
  const { idPresupuesto } = useParams();

  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [cards, setCards] = useState([
    { id: "presupuesto-total", label: "Presupuesto Aprobado", className: "card span-3 card-sm" },
    { id: "total-gastado",     label: "Total Gastado",     className: "card span-3 card-sm" },
    { id: "saldo-disponible",  label: "Saldo Disponible",  className: "card span-3 card-sm" },
    { id: "ingresos-mes",      label: "Ingresos del Mes",  className: "card span-3 card-sm" },

    { id: "ejecucion-grafico", label: "Gasto Real vs. Planificado", className: "card span-8 card-lg" },
    { id: "gastos-categoria",  label: "Gastos por Categoría",      className: "card span-8 card-lg" },
    { id: "ultimos-movimientos", label: "Últimas Transacciones",    className: "card span-8 card-lg" },

    { id: "historico-barras",  label: "Histórico Mensual",   className: "card span-4 card-md" },
    { id: "alertas-limite",    label: "Alertas y Fechas",    className: "card span-4 card-md" },
    { id: "acciones-rapidas",  label: "Acciones Rápidas",    className: "card span-4 card-md" },
  ]);

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
  setCargando(true);
  setError(null);

  api.get('/dashboard/summary')
    .then((res) => {
      setResumen(res.data);
    })
    .catch((err) => {
      if (err.response && err.response.status === 401) {
        setError("Sesión expirada. Por favor, inicia sesión nuevamente.");
      } else {
        setError("Error al cargar el resumen del presupuesto.");
      }
    })
    .finally(() => {
      setCargando(false);
    });
}, []);

  function handleDragEnd(event) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setCards((prev) => {
        const oldIndex = prev.findIndex((c) => c.id === active.id);
        const newIndex = prev.findIndex((c) => c.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }

  function renderValor(id) {
    if (!resumen) return "Sin datos";

    switch (id) {
      case "presupuesto-total":
        return `$${resumen.presupuestoTotal.toLocaleString()}`;
      case "total-gastado":
        return `$${resumen.totalGastado.toLocaleString()}`;
      case "saldo-disponible":
        return `$${resumen.saldoDisponible.toLocaleString()}`;
      default:
        return null; // cards sin data todavía (gráficos, ingresos-mes, etc.)
    }
  }

  const idsConData = ["presupuesto-total", "total-gastado", "saldo-disponible"];

  if (error) return <p className="p-6 text-center text-red-500">Error: {error}</p>;

  return (
    <main className="main-content">
      <div className="dashboard">

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={cards.map((c) => c.id)}
            strategy={rectSortingStrategy}
          >
            {cards.map((card) => (
            <SortableCard key={card.id} id={card.id} className={card.className}>
            <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
            {idsConData.includes(card.id) && (
            <p className="text-2xl font-bold mt-1">
            {cargando ? "…" : renderValor(card.id)}
            </p>
          )}
          </SortableCard>
        ))}
          </SortableContext>
        </DndContext>
      </div>
    </main>
  );
}