"use client";

import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusSignIcon, Comment01Icon, ArrowLeft01Icon, Upload01Icon } from "@/components/ui/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { toast } from "sonner";
import { useRealtime } from "@/hooks/use-realtime";
import { EditClientDialog } from "./edit-client-form";

interface Request {
  id: string;
  title: string;
  description: string | null;
  type: "logo" | "social" | "web" | "brand" | "presentation" | "other";
  status: "queued" | "in_progress" | "review" | "done";
  priority: number;
  created_at: string;
  updated_at: string;
  due_date: string | null;
  deliverables: { id: string; file_name: string; file_path: string; mime_type: string | null }[];
  comments: { id: string }[];
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
}

type RequestStatus = Request["status"];

interface Client {
  id: string;
  name: string;
  slug: string;
  retainer_amount: number | null;
  is_active: boolean;
}

interface AdminBoardProps {
  client: Client;
  requests: Request[];
}

const columns = [
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

const statusLabels: Record<string, string> = {
  queued: "QUEUED",
  in_progress: "IN PROGRESS",
  review: "AWAITING REVIEW",
  done: "DELIVERED",
};

function BoardCardContent({ request }: { request: Request }) {
  const timeSince = new Date(request.updated_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardContent className="p-4 space-y-3">
        <h3 className="font-medium text-sm leading-tight group-hover:text-[#909af7] transition-colors">
          {request.title}
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="secondary"
            className={`text-[10px] px-1.5 py-0 ${typeColors[request.type] ?? typeColors.other}`}
          >
            {request.type.toUpperCase()}
          </Badge>
          {request.status === "review" && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-600">
              {statusLabels[request.status]}
            </Badge>
          )}
          {request.status === "done" && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-600">
              {statusLabels[request.status]}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>{timeSince}</span>
            {request.due_date && (() => {
              const due = new Date(request.due_date);
              const now = new Date();
              const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const isOverdue = daysUntil < 0;
              const isDueSoon = daysUntil >= 0 && daysUntil <= 2;
              return (
                <span className={`text-[10px] font-medium ${isOverdue ? "text-red-600" : isDueSoon ? "text-amber-600" : "text-muted-foreground"}`}>
                  {isOverdue ? `Overdue ${Math.abs(daysUntil)}d` : daysUntil === 0 ? "Due today" : `Due in ${daysUntil}d`}
                </span>
              );
            })()}
          </div>
          <div className="flex items-center gap-3">
            {request.deliverables.length > 0 && (
              <div className="flex items-center gap-1">
                <Upload01Icon size={12} />
                <span>{request.deliverables.length}</span>
              </div>
            )}
            {request.comments.length > 0 && (
              <div className="flex items-center gap-1">
                <Comment01Icon size={12} />
                <span>{request.comments.length}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DraggableBoardCard({ request }: { request: Request }) {
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
        onClick={() => {
          if (!isDragging) {
            router.push(`/portal/requests/${request.id}`);
          }
        }}
        className="cursor-grab active:cursor-grabbing"
      >
        <BoardCardContent request={request} />
      </div>
    </div>
  );
}

function DroppableColumn({
  columnKey,
  label,
  color,
  requests,
}: {
  columnKey: string;
  label: string;
  color: string;
  requests: Request[];
}) {
  const { isOver, setNodeRef } = useDroppable({ id: columnKey });

  return (
    <div
      ref={setNodeRef}
      className={`space-y-3 rounded-lg transition-colors ${
        isOver ? "bg-accent/50 ring-2 ring-primary/20" : ""
      }`}
    >
      <div className="flex items-center gap-2 pb-2">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <span className="text-xs text-muted-foreground ml-auto">
          {requests.length}
        </span>
      </div>
      <div className="space-y-3 min-h-[60px]">
        {requests.map((request) => (
          <DraggableBoardCard key={request.id} request={request} />
        ))}
      </div>
      {requests.length === 0 && !isOver && (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
          <p className="text-xs text-muted-foreground">No requests</p>
        </div>
      )}
      {requests.length === 0 && isOver && (
        <div className="border-2 border-dashed border-primary/40 rounded-lg p-4 text-center bg-primary/5">
          <p className="text-xs text-primary">Drop here</p>
        </div>
      )}
    </div>
  );
}

export function AdminBoard({ client, requests: initialRequests }: AdminBoardProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>(initialRequests);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const activeRequest = activeId
    ? requests.find((r) => r.id === activeId) ?? null
    : null;

  // Realtime: live status updates
  useRealtime({
    table: "requests",
    event: "UPDATE",
    onEvent: () => router.refresh(),
  });

  const openCount = requests.filter((r) => r.status !== "done").length;

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

      const supabase = createClient();
      const { error } = await supabase
        .from("requests")
        .update({ status: newStatus })
        .eq("id", requestId);

      if (error) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId ? { ...r, status: request.status } : r
          )
        );
        toast.error("Couldn't update status. Please try again.");
      } else {
        toast.success(`Moved to ${columns.find((c) => c.key === newStatus)?.label}`);
        router.refresh();

        // Fire-and-forget email notification
        fetch("/api/portal/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "status_changed",
            request_id: requestId,
            new_status: newStatus,
            old_status: request.status,
          }),
        }).catch(() => {});
      }
    },
    [requests, router]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/portal/admin/clients"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft01Icon size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{client.name}</h1>
              <EditClientDialog client={client} />
              <Badge
                variant="outline"
                className={
                  client.is_active
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-gray-50 text-gray-500 border-gray-200"
                }
              >
                {client.is_active ? "Active" : "Paused"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              ${client.retainer_amount ?? 0}/mo &middot; {openCount} open{" "}
              {openCount === 1 ? "request" : "requests"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/portal/requests/new?client=${client.id}`}>
            <Button variant="outline" className="gap-2">
              <PlusSignIcon size={16} />
              Add Request
            </Button>
          </Link>
        </div>
      </div>

      {/* Kanban with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[60vh]">
          {columns.map((col) => {
            const colRequests = requests.filter((r) => r.status === col.key);
            return (
              <DroppableColumn
                key={col.key}
                columnKey={col.key}
                label={col.label}
                color={col.color}
                requests={colRequests}
              />
            );
          })}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeRequest ? (
            <div className="opacity-90 rotate-2 scale-105 shadow-xl">
              <BoardCardContent request={activeRequest} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
