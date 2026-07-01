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
import React, { useState } from 'react';

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
  const [cards, setCards] = useState([
    { id: "card-1", label: "Card 1",    className: "card span-3 card-sm" },
    { id: "card-2", label: "Card 2",    className: "card span-3 card-sm" },
    { id: "card-3", label: "Card 3",    className: "card span-3 card-sm" },
    { id: "card-4", label: "Card 4",    className: "card span-3 card-sm" },
    { id: "grafico",     label: "Gráfico",   className: "card span-8 card-lg" },
    { id: "dona",        label: "Dona",      className: "card span-8 card-lg" },
    { id: "movimientos", label: "Movimientos", className: "card span-8 card-lg" },
    { id: "barras",  label: "Barras",  className: "card span-4 card-md" },
    { id: "alertas", label: "Alertas", className: "card span-4 card-md" },
    { id: "atajos",  label: "Atajos",  className: "card span-4 card-md" },
  ]);

  const sensors = useSensors(useSensor(PointerSensor));

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
                {card.label}
              </SortableCard>
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </main>
  );
}
