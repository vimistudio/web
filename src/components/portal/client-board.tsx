"use client";

import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusSignIcon, Comment01Icon } from "@/components/ui/icons";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { createClient } from "@/lib/supabase/client";
import { useRealtime } from "@/hooks/use-realtime";

interface Request {
  id: string;
  title: string;
  description: string | null;
  type: "logo" | "social" | "web" | "brand" | "presentation" | "other";
  status: "queued" | "in_progress" | "review" | "done";
  priority: number;
  created_at: string;
  updated_at: string;
  deliverables: { id: string; file_path: string; mime_type: string | null }[];
  comments: { id: string }[];
}

type RequestStatus = Request["status"];

interface ClientBoardProps {
  clientName: string;
  requests: Request[];
  requestCount: number;
  isAdmin?: boolean;
}

const statusColumns = [
  { key: "queued" as const, label: "Queued", color: "bg-gray-400" },
  { key: "in_progress" as const, label: "In Progress", color: "bg-blue-500" },
  { key: "review" as const, label: "Review", color: "bg-amber-500" },
  { key: "done" as const, label: "Done", color: "bg-emerald-500" },
];

const typeColors: Record<string, string> = {
  logo: "bg-purple-100 text-purple-700",
  social: "bg-pink-100 text-pink-700",
  web: "bg-blue-100 text-blue-700",
  brand: "bg-amber-100 text-amber-700",
  presentation: "bg-emerald-100 text-emerald-700",
  other: "bg-gray-100 text-gray-700",
};

const typeGradients: Record<string, string> = {
  logo: "from-purple-100 to-purple-50",
  social: "from-pink-100 to-pink-50",
  web: "from-blue-100 to-blue-50",
  brand: "from-amber-100 to-amber-50",
  presentation: "from-emerald-100 to-emerald-50",
  other: "from-gray-100 to-gray-50",
};

function RequestCardContent({ request }: { request: Request }) {
  const timeSince = new Date(request.updated_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const gradient = typeGradients[request.type] ?? typeGradients.other;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
      <div
        className={`h-16 md:h-20 bg-gradient-to-br ${gradient}`}
      />
      <CardContent className="p-3 md:p-4 space-y-2">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-sm leading-tight">
            {request.title}
          </h3>
          {request.comments.length > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground shrink-0 ml-2">
              <Comment01Icon size={14} />
              <span className="text-xs">{request.comments.length}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={`text-[10px] px-1.5 py-0 ${typeColors[request.type] ?? typeColors.other}`}
          >
            {request.type.toUpperCase()}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Updated {timeSince}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function RequestCard({ request }: { request: Request }) {
  return (
    <Link href={`/portal/requests/${request.id}`}>
      <RequestCardContent request={request} />
    </Link>
  );
}

function DraggableRequestCard({ request }: { request: Request }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: request.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <div
        onClick={(e) => {
          if (!isDragging) {
            router.push(`/portal/requests/${request.id}`);
          }
        }}
        className="cursor-grab active:cursor-grabbing"
      >
        <RequestCardContent request={request} />
      </div>
    </div>
  );
}

function DroppableColumn({
  columnKey,
  label,
  color,
  requests,
  canDrag,
}: {
  columnKey: string;
  label: string;
  color: string;
  requests: Request[];
  canDrag: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: columnKey });

  return (
    <div
      ref={canDrag ? setNodeRef : undefined}
      className={`space-y-3 rounded-lg transition-colors ${
        isOver && canDrag ? "bg-accent/50 ring-2 ring-primary/20" : ""
      }`}
    >
      <div className="flex items-center gap-2 pb-2">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-sm font-semibold text-muted-foreground">
          {label}
        </span>
        <span className="text-xs text-muted-foreground ml-auto">
          {requests.length}
        </span>
      </div>
      <div className="space-y-3 min-h-[60px]">
        {requests.map((request) =>
          canDrag ? (
            <DraggableRequestCard key={request.id} request={request} />
          ) : (
            <RequestCard key={request.id} request={request} />
          )
        )}
      </div>
      {requests.length === 0 && !isOver && (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
          <p className="text-xs text-muted-foreground">Nothing here yet</p>
        </div>
      )}
      {requests.length === 0 && isOver && canDrag && (
        <div className="border-2 border-dashed border-primary/40 rounded-lg p-6 text-center bg-primary/5">
          <p className="text-xs text-primary">Drop here</p>
        </div>
      )}
    </div>
  );
}

export function ClientBoard({
  clientName,
  requests: initialRequests,
  requestCount,
  isAdmin = false,
}: ClientBoardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>(initialRequests);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Require 8px movement before drag starts — prevents accidental drags on click
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const activeRequest = activeId
    ? requests.find((r) => r.id === activeId) ?? null
    : null;

  // Realtime: live status updates from admin
  useRealtime({
    table: "requests",
    event: "UPDATE",
    onEvent: () => router.refresh(),
  });

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;

      const requestId = active.id as string;
      const newStatus = over.id as RequestStatus;

      const request = requests.find((r) => r.id === requestId);
      if (!request || request.status === newStatus) return;

      // Optimistic update
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, status: newStatus } : r
        )
      );

      // Persist to Supabase
      const supabase = createClient();
      const { error } = await supabase
        .from("requests")
        .update({ status: newStatus })
        .eq("id", requestId);

      if (error) {
        // Revert on failure
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId ? { ...r, status: request.status } : r
          )
        );
      } else {
        router.refresh();
      }
    },
    [requests, router]
  );

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {clientName}
            </h1>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hidden md:inline-flex">
              Active
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            We&apos;re working on {requestCount} design{requestCount === 1 ? "" : "s"} for you
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Board / Gallery toggle — desktop only */}
          <div className="hidden md:flex gap-1 bg-[#f0eeec] rounded-lg p-1">
            <Link
              href="/portal"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/portal"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Board
            </Link>
            <Link
              href="/portal/gallery"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/portal/gallery"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Gallery
            </Link>
          </div>

          {/* New Request */}
          <Link href="/portal/requests/new">
            {/* Mobile: FAB */}
            <Button
              size="icon"
              className="md:hidden rounded-full h-12 w-12 bg-[#909af7] hover:bg-[#7b85e8] shadow-lg fixed bottom-20 right-4 z-40"
            >
              <PlusSignIcon size={20} color="white" />
            </Button>
            {/* Desktop: button */}
            <Button className="hidden md:flex gap-2 bg-[#909af7] hover:bg-[#7b85e8]">
              <PlusSignIcon size={16} color="white" />
              New Request
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile: Board/Gallery tabs */}
      <div className="flex gap-4 border-b md:hidden">
        <Link
          href="/portal"
          className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${
            pathname === "/portal"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground"
          }`}
        >
          Board
        </Link>
        <Link
          href="/portal/gallery"
          className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
            pathname === "/portal/gallery"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground"
          }`}
        >
          Gallery
        </Link>
      </div>

      {/* Mobile: status summary */}
      <div className="flex gap-3 md:hidden text-xs text-muted-foreground">
        {statusColumns.map((col) => {
          const count = requests.filter((r) => r.status === col.key).length;
          if (count === 0) return null;
          return (
            <div key={col.key} className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${col.color}`} />
              <span>{count} {col.label}</span>
            </div>
          );
        })}
      </div>

      {/* Desktop: 4-column kanban with drag-and-drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="hidden md:grid grid-cols-4 gap-5 min-h-[50vh]">
          {statusColumns.map((col) => {
            const colRequests = requests.filter((r) => r.status === col.key);
            return (
              <DroppableColumn
                key={col.key}
                columnKey={col.key}
                label={col.label}
                color={col.color}
                requests={colRequests}
                canDrag={isAdmin}
              />
            );
          })}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeRequest ? (
            <div className="opacity-90 rotate-2 scale-105 shadow-xl">
              <RequestCardContent request={activeRequest} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Mobile: stacked cards by status */}
      <div className="md:hidden space-y-3">
        {statusColumns.map((col) => {
          const colRequests = requests.filter((r) => r.status === col.key);
          if (colRequests.length === 0) return null;
          return (
            <div key={col.key} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${col.color}`} />
                <h2 className="text-sm font-medium text-muted-foreground">
                  {col.label}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {colRequests.length}
                </span>
              </div>
              {colRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          );
        })}

        {requests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-[#909af7]/10 flex items-center justify-center mb-4">
              <PlusSignIcon size={24} className="text-[#909af7]" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Your studio is ready</h2>
            <p className="text-muted-foreground max-w-sm mb-6">
              What would you like us to design first? Submit a request and your designer will get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
