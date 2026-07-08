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
import { PlanEditorDialog } from "./plan-editor";
import { StudioNoteDialog } from "./studio-note-dialog";
import { AssigneeMenu, type Admin } from "./assignee-control";
import { usePricePrivacy, maskPrice } from "@/hooks/use-price-privacy";

interface Request {
  id: string;
  title: string;
  description: string | null;
  type: "logo" | "social" | "web" | "brand" | "presentation" | "other";
  status: "queued" | "in_progress" | "review" | "done";
  priority: number;
  is_archived?: boolean;
  assignee_id: string | null;
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
  studio_note?: string | null;
}

interface PlanMilestone {
  id: string;
  track: string;
  week: number;
  title: string;
  description: string | null;
  status: string;
  needs_client: boolean;
  request_id: string | null;
  sort: number;
  delay_note: string | null;
}

interface AdminBoardProps {
  client: Client;
  requests: Request[];
  milestones?: PlanMilestone[];
  admins?: Admin[];
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

function BoardCardContent({
  request,
  clientSlug,
  admins = [],
  onArchive,
  onUnarchive,
}: {
  request: Request;
  clientSlug: string;
  admins?: Admin[];
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
}) {
  const timeSince = new Date(request.updated_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const isArchived = !!request.is_archived;

  return (
    <Card className={`hover:shadow-md transition-shadow cursor-pointer group relative ${isArchived ? "opacity-50" : ""}`}>
      {/* Archive / Unarchive button */}
      {isArchived && onUnarchive ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onUnarchive(request.id);
          }}
          className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-md bg-white border border-gray-200 text-[10px] font-medium text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Restore
        </button>
      ) : onArchive && !isArchived ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onArchive(request.id);
          }}
          className="absolute top-2 right-2 z-10 w-6 h-6 rounded-md bg-white/80 hover:bg-red-50 border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          title="Archive"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 hover:text-red-500">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      ) : null}
      <CardContent className="p-4 space-y-3">
        <h3 className="font-medium text-sm leading-tight group-hover:text-primary transition-colors">
          {request.title}
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="secondary"
            className={`text-[10px] px-1.5 py-0 ${typeColors[request.type] ?? typeColors.other}`}
          >
            {request.type.toUpperCase()}
          </Badge>
          {isArchived && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-500">
              ARCHIVED
            </Badge>
          )}
          {request.status === "review" && !isArchived && (
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
            <AssigneeMenu
              requestId={request.id}
              assigneeId={request.assignee_id}
              admins={admins}
            />
          </div>
        </div>

        {request.type === "social" && (
          <Link
            href={`/portal/admin/clients/${clientSlug}/social/new?requestId=${request.id}`}
            onClick={(e) => e.stopPropagation()}
            className="block mt-1"
          >
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-pink-600 hover:text-pink-700 transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
              Build Carousel
            </span>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

function DraggableBoardCard({ request, clientSlug, admins, onArchive, onUnarchive }: { request: Request; clientSlug: string; admins: Admin[]; onArchive: (id: string) => void; onUnarchive: (id: string) => void }) {
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
        <BoardCardContent request={request} clientSlug={clientSlug} admins={admins} onArchive={onArchive} onUnarchive={onUnarchive} />
      </div>
    </div>
  );
}

function DroppableColumn({
  columnKey,
  label,
  color,
  requests,
  clientSlug,
  admins,
  onArchive,
  onUnarchive,
}: {
  columnKey: string;
  label: string;
  color: string;
  requests: Request[];
  clientSlug: string;
  admins: Admin[];
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
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
          <DraggableBoardCard key={request.id} request={request} clientSlug={clientSlug} admins={admins} onArchive={onArchive} onUnarchive={onUnarchive} />
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

export function AdminBoard({ client, requests: initialRequests, milestones = [], admins = [] }: AdminBoardProps) {
  const router = useRouter();
  const { hidden: pricesHidden } = usePricePrivacy();
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

  const [showArchived, setShowArchived] = useState(false);
  const visibleRequests = showArchived
    ? requests
    : requests.filter((r) => !r.is_archived);
  const archivedCount = requests.filter((r) => r.is_archived).length;
  const openCount = visibleRequests.filter((r) => r.status !== "done").length;

  const handleArchive = useCallback(
    async (requestId: string) => {
      // Optimistic removal
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, is_archived: true } : r
        )
      );

      const supabase = createClient();
      const { error } = await supabase
        .from("requests")
        .update({ is_archived: true })
        .eq("id", requestId);

      if (error) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId ? { ...r, is_archived: false } : r
          )
        );
        toast.error("Couldn't archive. Try again.");
      } else {
        toast.success("Request archived");
        router.refresh();
      }
    },
    [router]
  );

  const handleUnarchive = useCallback(
    async (requestId: string) => {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, is_archived: false } : r
        )
      );

      const supabase = createClient();
      const { error } = await supabase
        .from("requests")
        .update({ is_archived: false })
        .eq("id", requestId);

      if (error) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId ? { ...r, is_archived: true } : r
          )
        );
        toast.error("Couldn't restore. Try again.");
      } else {
        toast.success("Request restored");
        router.refresh();
      }
    },
    [router]
  );

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
              {maskPrice(`$${client.retainer_amount ?? 0}`, pricesHidden)}/mo &middot; {openCount} open{" "}
              {openCount === 1 ? "request" : "requests"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {archivedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => setShowArchived(!showArchived)}
            >
              {showArchived ? "Hide" : "Show"} archived ({archivedCount})
            </Button>
          )}
          <PlanEditorDialog
            clientId={client.id}
            clientName={client.name}
            requests={requests.map((r) => ({ id: r.id, title: r.title }))}
            milestones={milestones}
          />
          <StudioNoteDialog
            clientId={client.id}
            studioNote={client.studio_note ?? null}
          />
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
            const colRequests = visibleRequests.filter((r) => r.status === col.key);
            return (
              <DroppableColumn
                key={col.key}
                columnKey={col.key}
                label={col.label}
                color={col.color}
                requests={colRequests}
                clientSlug={client.slug}
                admins={admins}
                onArchive={handleArchive}
                onUnarchive={handleUnarchive}
              />
            );
          })}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeRequest ? (
            <div className="opacity-90 rotate-2 scale-105 shadow-xl">
              <BoardCardContent request={activeRequest} clientSlug={client.slug} admins={admins} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
