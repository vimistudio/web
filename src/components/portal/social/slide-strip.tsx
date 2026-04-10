"use client";

import { useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { PlusSignIcon, Cancel01Icon } from "@/components/ui/icons";

interface Slide {
  id: string;
  slide_order: number;
  image_path: string | null;
  url: string | null;
  alt_text: string | null;
}

interface SlideStripProps {
  slides: Slide[];
  activeSlideId: string | null;
  onSelect: (id: string) => void;
  onReorder: (slides: Slide[]) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

function SortableThumbnail({
  slide,
  index,
  isActive,
  onSelect,
  onDelete,
}: {
  slide: Slide;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onSelect}
      className={`relative flex-shrink-0 w-[72px] h-[90px] rounded-lg overflow-hidden cursor-pointer border-2 transition-colors group ${
        isActive
          ? "border-blue-500 shadow-md"
          : "border-transparent hover:border-gray-300"
      }`}
    >
      {slide.url ? (
        <img
          src={slide.url}
          alt={slide.alt_text || `Slide ${index + 1}`}
          className="w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400 text-xs">Empty</span>
        </div>
      )}
      {/* Slide number badge */}
      <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
        <span className="text-[10px] font-bold text-white">{index + 1}</span>
      </div>
      {/* Delete button on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Cancel01Icon className="w-3 h-3 text-white" />
      </button>
    </div>
  );
}

export function SlideStrip({
  slides,
  activeSlideId,
  onSelect,
  onReorder,
  onAdd,
  onDelete,
}: SlideStripProps) {
  const [dragActiveId, setDragActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setDragActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDragActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = slides.findIndex((s) => s.id === active.id);
      const newIndex = slides.findIndex((s) => s.id === over.id);
      const reordered = arrayMove(slides, oldIndex, newIndex).map((s, i) => ({
        ...s,
        slide_order: i,
      }));
      onReorder(reordered);
    },
    [slides, onReorder]
  );

  const dragSlide = dragActiveId
    ? slides.find((s) => s.id === dragActiveId)
    : null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-3 px-1">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={slides.map((s) => s.id)}
          strategy={horizontalListSortingStrategy}
        >
          {slides.map((slide, i) => (
            <SortableThumbnail
              key={slide.id}
              slide={slide}
              index={i}
              isActive={slide.id === activeSlideId}
              onSelect={() => onSelect(slide.id)}
              onDelete={() => onDelete(slide.id)}
            />
          ))}
        </SortableContext>

        <DragOverlay>
          {dragSlide && (
            <div className="w-[72px] h-[90px] rounded-lg overflow-hidden border-2 border-blue-500 shadow-lg opacity-80">
              {dragSlide.url ? (
                <img
                  src={dragSlide.url}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full bg-gray-100" />
              )}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Add slide button */}
      <button
        onClick={onAdd}
        className="flex-shrink-0 w-[72px] h-[90px] rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-colors"
      >
        <PlusSignIcon className="w-5 h-5 text-gray-400" />
      </button>
    </div>
  );
}
