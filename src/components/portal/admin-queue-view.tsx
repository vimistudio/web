"use client";

import { useState, useMemo, useCallback, useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AssigneeAvatar, type Admin } from "./assignee-control";
import { useWorkScope } from "@/hooks/use-work-scope";

// --- Types ---

interface QueueRequest {
  id: string;
  title: string;
  type: string;
  status: "queued" | "in_progress" | "review" | "done";
  priority: number;
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
  due_date: string | null;
  is_archived: boolean;
  queue_rank: number | null;
  clients: {
    name: string;
    slug: string;
    is_active: boolean;
    designer_id: string | null;
    accent_color: string | null;
  } | null;
  deliverables: { id: string }[];
  comments: { id: string; created_at: string; author_id: string }[];
}

interface AdminQueueViewProps {
  requests: QueueRequest[];
  adminId: string;
  admins: Admin[];
  /** Owner = admin + is_owner. Only owners see the permanent-delete action. */
  isOwner?: boolean;
}

// --- Constants ---

type StatusTab = "all" | "queued" | "in_progress" | "review";

const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "queued", label: "En cola" },
  { key: "in_progress", label: "En proceso" },
  { key: "review", label: "Revisión" },
];

const DEFAULT_ACCENT = "#5B4BD6";
const ROSEWOOD = "#B03A5B";
const STALE_DAYS = 6; // in review longer than this → "se está enfriando"
const RANK_STEP = 1000;

const statusDotColor: Record<string, string> = {
  queued: "#9A96A3",
  in_progress: "#4064C9",
  review: "#C9821B",
};

const statusLabel: Record<string, string> = {
  queued: "En cola",
  in_progress: "En proceso",
  review: "Revisión",
};

const TYPE_LABELS: Record<string, string> = {
  logo: "LOGO",
  social: "SOCIAL",
  web: "WEB",
  brand: "MARCA",
  presentation: "DECK",
  other: "OTRO",
};

const typeColors: Record<string, string> = {
  logo: "bg-purple-100 text-purple-700",
  social: "bg-pink-100 text-pink-700",
  web: "bg-blue-100 text-blue-700",
  brand: "bg-amber-100 text-amber-700",
  presentation: "bg-emerald-100 text-emerald-700",
  other: "bg-gray-100 text-gray-700",
};

function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type.toUpperCase();
}

// --- Helpers ---

function hasNewComment(request: QueueRequest, adminId: string): boolean {
  if (request.comments.length === 0) return false;
  const latest = request.comments.reduce((a, b) =>
    new Date(a.created_at) > new Date(b.created_at) ? a : b
  );
  return latest.author_id !== adminId;
}

function isPaused(request: QueueRequest): boolean {
  return request.clients?.is_active === false;
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function isStale(request: QueueRequest): boolean {
  return request.status === "review" && daysSince(request.updated_at) > STALE_DAYS;
}

function needsAttention(request: QueueRequest): boolean {
  return isOverdue(request.due_date) || isStale(request);
}

function accentOf(request: QueueRequest): string {
  return request.clients?.accent_color || DEFAULT_ACCENT;
}

function ageLabel(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: false, locale: es });
}

function dueDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("es", { day: "numeric", month: "short" });
}

// Admin work order: queue_rank asc (nulls last), then priority desc, created_at asc.
function adminSort(a: QueueRequest, b: QueueRequest): number {
  const ar = a.queue_rank;
  const br = b.queue_rank;
  if (ar != null && br != null && ar !== br) return ar - br;
  if (ar != null && br == null) return -1;
  if (ar == null && br != null) return 1;
  if (b.priority !== a.priority) return b.priority - a.priority;
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}

// --- Component ---

export function AdminQueueView({ requests, adminId, admins, isOwner = true }: AdminQueueViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<StatusTab>("all");
  const [showPaused, setShowPaused] = useState(false);
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);
  const { scope, setScope } = useWorkScope();
  const solo = admins.length <= 1;

  // Local mirror of the server data so archive/restore/reorder can be
  // optimistic. Re-syncs whenever the server re-fetches (router.refresh()).
  const [rows, setRows] = useState<QueueRequest[]>(requests);
  useEffect(() => {
    setRows(requests);
  }, [requests]);
  const rowsRef = useRef(rows);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const isMine = useCallback(
    (r: QueueRequest) => {
      if (r.assignee_id) return r.assignee_id === adminId;
      const designerId = r.clients?.designer_id ?? null;
      return designerId === adminId || designerId == null;
    },
    [adminId]
  );

  // Archived are OUT of every count and the queue (the #121 fix).
  const archived = useMemo(() => rows.filter((r) => r.is_archived), [rows]);
  const nonArchived = useMemo(() => rows.filter((r) => !r.is_archived), [rows]);

  const pausedCount = useMemo(
    () => nonArchived.filter(isPaused).length,
    [nonArchived]
  );

  const baseRequests = useMemo(
    () => (showPaused ? nonArchived : nonArchived.filter((r) => !isPaused(r))),
    [nonArchived, showPaused]
  );

  const mineCount = useMemo(
    () => baseRequests.filter(isMine).length,
    [baseRequests, isMine]
  );
  const everyoneCount = baseRequests.length;

  const scopedRequests = useMemo(
    () => (scope === "mine" && !solo ? baseRequests.filter(isMine) : baseRequests),
    [baseRequests, scope, isMine, solo]
  );

  // Client chips (with accent dot) over the current inclusion set.
  const clientChips = useMemo(() => {
    const map = new Map<
      string,
      { slug: string; name: string; accent: string; count: number }
    >();
    for (const r of scopedRequests) {
      if (!r.clients) continue;
      const existing = map.get(r.clients.slug);
      if (existing) existing.count++;
      else
        map.set(r.clients.slug, {
          slug: r.clients.slug,
          name: r.clients.name,
          accent: accentOf(r),
          count: 1,
        });
    }
    return Array.from(map.values()).sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name)
    );
  }, [scopedRequests]);

  const clientScoped = useMemo(
    () =>
      clientFilter === "all"
        ? scopedRequests
        : scopedRequests.filter((r) => r.clients?.slug === clientFilter),
    [scopedRequests, clientFilter]
  );

  // Status-tab counts (reflect inclusion set + client filter; not the tab).
  const counts = useMemo(() => {
    const c = { all: clientScoped.length, queued: 0, in_progress: 0, review: 0 };
    for (const r of clientScoped) {
      if (r.status in c) c[r.status as keyof typeof c]++;
    }
    return c;
  }, [clientScoped]);

  // Apply the status tab, then split into the two labelled groups.
  const statusFiltered = useMemo(
    () =>
      activeTab === "all"
        ? clientScoped
        : clientScoped.filter((r) => r.status === activeTab),
    [clientScoped, activeTab]
  );

  const attention = useMemo(
    () => statusFiltered.filter(needsAttention).sort(adminSort),
    [statusFiltered]
  );

  const workOrder = useMemo(
    () =>
      statusFiltered
        .filter((r) => !needsAttention(r))
        .slice()
        .sort(adminSort),
    [statusFiltered]
  );

  // Hero counts (Pareto): honest, over the visible inclusion set.
  const overdueCount = useMemo(
    () => scopedRequests.filter((r) => isOverdue(r.due_date)).length,
    [scopedRequests]
  );
  const openCount = scopedRequests.length;
  const clientCount = useMemo(
    () => new Set(scopedRequests.map((r) => r.clients?.slug).filter(Boolean)).size,
    [scopedRequests]
  );

  // Reorder is only offered in the unfiltered global view, so the visible EN
  // ORDEN list matches the global order and rank math can't collide with
  // hidden rows. Numbers still show under a filter — just not draggable.
  const canReorder =
    activeTab === "all" &&
    clientFilter === "all" &&
    (solo || scope === "everyone");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // --- Archive / restore (existing behavior, optimistic) ---

  const handleArchive = useCallback(
    async (id: string) => {
      const snapshot = rowsRef.current;
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_archived: true } : r))
      );
      const supabase = createClient();
      const { error } = await supabase
        .from("requests")
        .update({ is_archived: true })
        .eq("id", id);
      if (error) {
        setRows(snapshot);
        toast.error("No se pudo archivar. Intenta de nuevo.");
      } else {
        toast.success("Solicitud archivada");
        router.refresh();
      }
    },
    [router]
  );

  const handleRestore = useCallback(
    async (id: string) => {
      const snapshot = rowsRef.current;
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_archived: false } : r))
      );
      const supabase = createClient();
      const { error } = await supabase
        .from("requests")
        .update({ is_archived: false })
        .eq("id", id);
      if (error) {
        setRows(snapshot);
        toast.error("No se pudo restaurar. Intenta de nuevo.");
      } else {
        toast.success("Solicitud restaurada");
        router.refresh();
      }
    },
    [router]
  );

  // --- Permanent delete (owner-only, archived rows only) ---

  const handlePurge = useCallback(
    async (id: string) => {
      const snapshot = rowsRef.current;
      // Optimistic: drop the row from the archived list.
      setRows((prev) => prev.filter((r) => r.id !== id));
      try {
        const res = await fetch("/api/portal/queue/purge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? "Error");
        }
        toast.success("Solicitud eliminada");
        router.refresh();
      } catch {
        setRows(snapshot);
        toast.error("No se pudo eliminar. Intenta de nuevo.");
      }
    },
    [router]
  );

  // --- Drag to reprioritize ---

  async function persistReorder(updates: { id: string; queue_rank: number }[]) {
    const snapshot = rowsRef.current;
    // Optimistic: fold the new ranks into local state.
    const rankById = new Map(updates.map((u) => [u.id, u.queue_rank]));
    setRows((prev) =>
      prev.map((r) =>
        rankById.has(r.id) ? { ...r, queue_rank: rankById.get(r.id)! } : r
      )
    );
    try {
      const res = await fetch("/api/portal/queue/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Error");
      }
      router.refresh();
    } catch {
      setRows(snapshot);
      toast.error("No se pudo reordenar. Intenta de nuevo.");
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const list = workOrder;
    const oldI = list.findIndex((r) => r.id === active.id);
    const newI = list.findIndex((r) => r.id === over.id);
    if (oldI < 0 || newI < 0) return;

    const reordered = arrayMove(list, oldI, newI);
    const moved = reordered[newI];
    const prev = reordered[newI - 1];
    const next = reordered[newI + 1];
    const prevRank = prev?.queue_rank ?? null;
    const nextRank = next?.queue_rank ?? null;

    // Fast path: place the moved row at the midpoint of its new neighbors.
    let midpoint: number | null = null;
    const neighborsSeeded =
      (!prev || prevRank != null) && (!next || nextRank != null);
    if (neighborsSeeded) {
      if (prev && next) midpoint = (prevRank! + nextRank!) / 2;
      else if (prev) midpoint = prevRank! + RANK_STEP;
      else if (next) midpoint = nextRank! - RANK_STEP;
      else midpoint = RANK_STEP;
      // Guard against float collapse (no room between neighbors).
      if (
        (prev && midpoint <= prevRank!) ||
        (next && midpoint >= nextRank!)
      ) {
        midpoint = null;
      }
    }

    if (midpoint != null) {
      void persistReorder([{ id: moved.id, queue_rank: midpoint }]);
      return;
    }

    // Fallback: reseed the whole global open order with the moved row in its
    // new slot, so ranks stay globally consistent (incl. attention rows).
    const enOrderIds = reordered.map((r) => r.id);
    const attentionIds = new Set(attention.map((r) => r.id));
    const queue = [...enOrderIds];
    const allOpenSorted = nonArchived.slice().sort(adminSort);
    const newGlobalIds = allOpenSorted.map((r) =>
      attentionIds.has(r.id) ? r.id : (queue.shift() as string)
    );
    const updates = newGlobalIds.map((id, i) => ({
      id,
      queue_rank: (i + 1) * RANK_STEP,
    }));
    void persistReorder(updates);
  }

  // --- Render ---

  const filtersActive = activeTab !== "all" || clientFilter !== "all";
  const clearFilters = () => {
    setActiveTab("all");
    setClientFilter("all");
  };
  const hasVisible = attention.length > 0 || workOrder.length > 0;

  return (
    <div className="space-y-7">
      {/* HERO */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-serif italic text-[30px] md:text-[38px] leading-tight tracking-tight text-[color:var(--vimi-ink)]">
            La cola
          </h1>
          <p className="text-sm text-[color:var(--vimi-muted)] mt-2 leading-relaxed">
            {overdueCount > 0 && (
              <span className="inline-flex items-center gap-1.5 font-medium text-[color:var(--vimi-ink)]">
                <PulseDot color={ROSEWOOD} />
                {overdueCount} vencida{overdueCount === 1 ? "" : "s"}
                <span className="mx-1 text-[color:var(--vimi-faint)]">·</span>
              </span>
            )}
            {openCount} abierta{openCount === 1 ? "" : "s"} en {clientCount}{" "}
            cliente{clientCount === 1 ? "" : "s"} · ordenadas por lo que necesita
            atención primero
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 md:items-end shrink-0">
          {!solo && (
            <div
              className="inline-flex items-center rounded-full bg-[color:rgba(28,27,31,0.06)] p-0.5"
              role="tablist"
              aria-label="Alcance"
            >
              <ScopePill
                active={scope === "mine"}
                onClick={() => setScope("mine")}
                label="Míos"
                count={mineCount}
              />
              <ScopePill
                active={scope === "everyone"}
                onClick={() => setScope("everyone")}
                label="Todos"
                count={everyoneCount}
              />
            </div>
          )}
          {pausedCount > 0 && (
            <button
              onClick={() => setShowPaused((v) => !v)}
              className="text-xs text-[color:var(--vimi-muted)] hover:text-[color:var(--vimi-ink)] transition-colors underline-offset-2 hover:underline"
            >
              {showPaused
                ? "Ocultar clientes pausados"
                : `Ver ${pausedCount} cliente${pausedCount === 1 ? "" : "s"} pausado${pausedCount === 1 ? "" : "s"}`}
            </button>
          )}
        </div>
      </div>

      {/* FILTERS */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_TABS.map((tab) => (
            <Chip
              key={tab.key}
              active={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.key !== "all" && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: statusDotColor[tab.key] }}
                />
              )}
              {tab.label}
              <span
                className={
                  activeTab === tab.key
                    ? "text-[var(--vimi-page)]/70"
                    : "text-[color:var(--vimi-faint)]"
                }
              >
                {counts[tab.key]}
              </span>
            </Chip>
          ))}
        </div>

        {clientChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="h-4 w-px bg-[color:var(--vimi-border)] mr-0.5 hidden sm:block" />
            <Chip
              active={clientFilter === "all"}
              onClick={() => setClientFilter("all")}
            >
              Todos
            </Chip>
            {clientChips.map((chip) => (
              <Chip
                key={chip.slug}
                active={clientFilter === chip.slug}
                onClick={() => setClientFilter(chip.slug)}
              >
                <span
                  className="w-2 h-2 rounded-[3px] shrink-0"
                  style={{ background: chip.accent }}
                />
                {chip.name}
                <span
                  className={
                    clientFilter === chip.slug
                      ? "text-[var(--vimi-page)]/70"
                      : "text-[color:var(--vimi-faint)]"
                  }
                >
                  {chip.count}
                </span>
              </Chip>
            ))}
            {canReorder && workOrder.length > 1 && (
              <span className="ml-auto text-xs text-[color:var(--vimi-faint)] hidden md:block">
                Arrastra ⠿ para repriorizar — el cliente lo ve al instante
              </span>
            )}
          </div>
        )}
      </div>

      {/* EMPTY */}
      {!hasVisible ? (
        <div className="text-center py-20">
          <h2 className="font-serif italic text-2xl text-[color:var(--vimi-ink)]">
            Cola limpia. Respira.
          </h2>
          <p className="text-sm text-[color:var(--vimi-muted)] mt-2">
            {filtersActive
              ? "Ninguna solicitud coincide con estos filtros."
              : "No hay solicitudes abiertas ahora mismo."}
          </p>
          {filtersActive && (
            <button
              onClick={clearFilters}
              className="mt-4 text-sm text-[color:var(--accent)] hover:underline underline-offset-2"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-7">
          {/* NECESITA ATENCIÓN (Von Restorff) */}
          {attention.length > 0 && (
            <section className="space-y-3">
              <GroupHeader
                label="Necesita atención"
                count={attention.length}
                color={ROSEWOOD}
              />
              <div
                className="rounded-[16px] overflow-hidden border"
                style={{
                  borderColor: "rgba(176,58,91,0.25)",
                  background: "rgba(176,58,91,0.04)",
                }}
              >
                <div className="divide-y divide-[rgba(176,58,91,0.12)]">
                  {attention.map((request) => (
                    <AttentionRow
                      key={request.id}
                      request={request}
                      adminId={adminId}
                      admins={admins}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* EN ORDEN DE TRABAJO (draggable) */}
          {workOrder.length > 0 && (
            <section className="space-y-3">
              <GroupHeader
                label="En orden de trabajo"
                count={workOrder.length}
                color="var(--vimi-faint)"
              />
              <div className="rounded-[16px] border border-[color:var(--vimi-border)] bg-[var(--vimi-card)] overflow-hidden">
                {canReorder ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={workOrder.map((r) => r.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="divide-y divide-[color:var(--vimi-border)]">
                        {workOrder.map((request, i) => (
                          <SortableWorkRow key={request.id} id={request.id}>
                            {(handle) => (
                              <WorkRow
                                request={request}
                                position={i + 1}
                                adminId={adminId}
                                admins={admins}
                                onArchive={handleArchive}
                                dragHandle={handle}
                              />
                            )}
                          </SortableWorkRow>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="divide-y divide-[color:var(--vimi-border)]">
                    {workOrder.map((request, i) => (
                      <WorkRow
                        key={request.id}
                        request={request}
                        position={i + 1}
                        adminId={adminId}
                        admins={admins}
                        onArchive={handleArchive}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ARCHIVED (out of all counts + the queue) */}
      {archived.length > 0 && (
        <section className="pt-2">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="text-xs text-[color:var(--vimi-muted)] hover:text-[color:var(--vimi-ink)] transition-colors"
          >
            {showArchived ? "▾ " : "▸ "}
            {archived.length} solicitud{archived.length === 1 ? "" : "es"} archivada
            {archived.length === 1 ? "" : "s"} — no cuentan ni aparecen para el
            cliente
          </button>
          {showArchived && (
            <div className="mt-3 rounded-[16px] border border-[color:var(--vimi-border)] bg-[color:rgba(28,27,31,0.02)] overflow-hidden divide-y divide-[color:var(--vimi-border)]">
              {archived.map((request) => (
                <ArchivedRow
                  key={request.id}
                  request={request}
                  onRestore={handleRestore}
                  onPurge={handlePurge}
                  canPurge={isOwner}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// --- Sortable wrapper ---

function SortableWorkRow({
  id,
  children,
}: {
  id: string;
  children: (handle: {
    attributes: Record<string, unknown>;
    listeners: Record<string, unknown> | undefined;
  }) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: "relative",
    background: isDragging ? "var(--vimi-card)" : undefined,
  };
  return (
    <div ref={setNodeRef} style={style}>
      {children({
        attributes: attributes as unknown as Record<string, unknown>,
        listeners,
      })}
    </div>
  );
}

// --- Rows ---

function WorkRow({
  request,
  position,
  adminId,
  admins,
  onArchive,
  dragHandle,
}: {
  request: QueueRequest;
  position: number;
  adminId: string;
  admins: Admin[];
  onArchive: (id: string) => void;
  dragHandle?: {
    attributes: Record<string, unknown>;
    listeners: Record<string, unknown> | undefined;
  };
}) {
  const newComment = hasNewComment(request, adminId);
  const paused = isPaused(request);
  const overdue = isOverdue(request.due_date);

  return (
    <div className="flex items-center gap-3 px-3 sm:px-4 py-3 hover:bg-[color:rgba(28,27,31,0.02)] transition-colors group">
      {/* Drag handle */}
      {dragHandle ? (
        <span
          {...dragHandle.attributes}
          {...dragHandle.listeners}
          title="Arrastra para repriorizar"
          className="shrink-0 text-[color:var(--vimi-faint)] cursor-grab text-sm px-0.5 select-none"
          style={{ touchAction: "none" }}
        >
          ⠿
        </span>
      ) : (
        <span className="shrink-0 w-[15px]" />
      )}

      {/* Position number (Serial Position) */}
      <span className="shrink-0 w-5 text-right text-xs font-semibold tabular-nums text-[color:var(--vimi-faint)]">
        {position}
      </span>

      {/* Status dot (pulses for En proceso) */}
      <span className="shrink-0 relative flex items-center justify-center w-2.5 h-2.5">
        {request.status === "in_progress" && (
          <span
            className="vm-pulse absolute inset-0 rounded-full"
            style={{ background: statusDotColor.in_progress }}
          />
        )}
        <span
          className="w-2.5 h-2.5 rounded-full relative"
          style={{ background: statusDotColor[request.status] }}
          title={statusLabel[request.status]}
        />
      </span>

      {/* Title + meta */}
      <Link
        href={`/portal/requests/${request.id}`}
        className="flex-1 min-w-0 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3"
      >
        <span className="font-medium text-sm truncate text-[color:var(--vimi-ink)] group-hover:text-[color:var(--accent)] transition-colors">
          {request.title}
        </span>
        <span className="flex items-center gap-2 min-w-0">
          <TypeTag type={request.type} />
          {request.due_date && (
            <DueBadge dueDate={request.due_date} overdue={overdue} />
          )}
          {paused && <PausedChip />}
        </span>

        <span className="flex-1 hidden sm:block" />

        <span className="flex items-center gap-3 shrink-0 text-xs text-[color:var(--vimi-muted)]">
          {request.clients && (
            <span className="inline-flex items-center gap-1.5 min-w-0">
              <span
                className="w-2 h-2 rounded-[3px] shrink-0"
                style={{ background: accentOf(request) }}
              />
              <span className="truncate max-w-[120px]">
                {request.clients.name}
              </span>
            </span>
          )}
          {newComment && (
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"
              title="Comentario sin leer"
            />
          )}
          <AssigneeAvatar assigneeId={request.assignee_id} admins={admins} />
          <span className="tabular-nums whitespace-nowrap">
            {ageLabel(request.updated_at)}
          </span>
        </span>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onArchive(request.id)}
          title="Archivar"
          aria-label="Archivar"
          className="text-[color:var(--vimi-faint)] hover:text-[color:var(--vimi-ink)] transition-colors p-1.5 rounded-md hover:bg-[color:rgba(28,27,31,0.05)]"
        >
          ⌫
        </button>
        <Link
          href={`/portal/requests/${request.id}`}
          className="text-xs font-medium text-[color:var(--vimi-ink)] hover:text-[color:var(--accent)] transition-colors px-2 py-1.5 whitespace-nowrap"
        >
          Abrir →
        </Link>
      </div>
    </div>
  );
}

function AttentionRow({
  request,
  adminId,
  admins,
}: {
  request: QueueRequest;
  adminId: string;
  admins: Admin[];
}) {
  const overdue = isOverdue(request.due_date);
  const newComment = hasNewComment(request, adminId);
  const staleDays = daysSince(request.updated_at);

  const problem = overdue
    ? `Vencida desde ${dueDateShort(request.due_date!)}`
    : `En revisión hace ${staleDays} días — se está enfriando`;

  // Overdue → resolve; a cooling review → nudge the client (falls back to open).
  const ctaLabel = overdue ? "Resolver ahora" : "Recordar al cliente";

  return (
    <div className="flex items-start gap-3 px-3 sm:px-4 py-3.5">
      <span className="shrink-0 relative flex items-center justify-center w-2.5 h-2.5 mt-1.5">
        <span
          className="vm-pulse absolute inset-0 rounded-full"
          style={{ background: ROSEWOOD }}
        />
        <span
          className="w-2.5 h-2.5 rounded-full relative"
          style={{ background: ROSEWOOD }}
        />
      </span>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/portal/requests/${request.id}`}
            className="font-medium text-sm text-[color:var(--vimi-ink)] hover:underline underline-offset-2 truncate"
          >
            {request.title}
          </Link>
          <TypeTag type={request.type} />
          {request.clients && (
            <span className="inline-flex items-center gap-1.5 text-xs text-[color:var(--vimi-muted)]">
              <span
                className="w-2 h-2 rounded-[3px] shrink-0"
                style={{ background: accentOf(request) }}
              />
              {request.clients.name}
            </span>
          )}
          {newComment && (
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"
              title="Comentario sin leer"
            />
          )}
        </div>
        <p className="text-xs font-medium" style={{ color: ROSEWOOD }}>
          {problem}
        </p>
        <div className="flex items-center gap-3 text-xs text-[color:var(--vimi-faint)]">
          <AssigneeAvatar assigneeId={request.assignee_id} admins={admins} />
          <span className="tabular-nums">
            {ageLabel(request.updated_at)}
          </span>
        </div>
      </div>

      <Link
        href={`/portal/requests/${request.id}`}
        className="shrink-0 inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-xs font-semibold text-white transition-transform hover:-translate-y-0.5"
        style={{ background: ROSEWOOD }}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

function ArchivedRow({
  request,
  onRestore,
  onPurge,
  canPurge,
}: {
  request: QueueRequest;
  onRestore: (id: string) => void;
  onPurge: (id: string) => Promise<void>;
  canPurge: boolean;
}) {
  const [purging, setPurging] = useState(false);

  const handleConfirm = async () => {
    setPurging(true);
    await onPurge(request.id);
    // Row is removed optimistically on success; on failure it returns and the
    // component may unmount/remount — resetting here is a no-op either way.
    setPurging(false);
  };

  return (
    <div className="flex items-center gap-3 px-3 sm:px-4 py-2.5">
      <Link
        href={`/portal/requests/${request.id}`}
        className="flex-1 min-w-0 flex items-center gap-2"
      >
        <span className="text-sm line-through text-[color:var(--vimi-muted)] truncate">
          {request.title}
        </span>
        {request.clients && (
          <span className="text-xs text-[color:var(--vimi-faint)] truncate">
            {request.clients.name}
          </span>
        )}
      </Link>
      <span className="shrink-0 text-xs text-[color:var(--vimi-faint)] tabular-nums">
        archivada hace {ageLabel(request.updated_at)}
      </span>
      <button
        onClick={() => onRestore(request.id)}
        className="shrink-0 text-xs font-medium text-[color:var(--accent)] hover:underline underline-offset-2"
      >
        Restaurar
      </button>
      {canPurge && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            {/* Von Restorff: the one irreversible action — clearly different
                (rosewood) but restrained, not loud. */}
            <button
              title="Eliminar definitivamente"
              className="shrink-0 text-xs font-medium hover:underline underline-offset-2"
              style={{ color: ROSEWOOD }}
            >
              Eliminar definitivamente
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar definitivamente?</AlertDialogTitle>
              <AlertDialogDescription>
                Esto borra la solicitud «{request.title}», sus mensajes,
                entregables y archivos. No se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={purging}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  // Keep the dialog open while the request is in flight.
                  e.preventDefault();
                  void handleConfirm();
                }}
                disabled={purging}
                className="text-white"
                style={{ background: ROSEWOOD }}
              >
                {purging ? "Eliminando…" : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

// --- Sub-components ---

function GroupHeader({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="text-[11px] font-bold uppercase tracking-[0.14em]"
        style={{ color }}
      >
        {label}
      </span>
      <span className="text-[11px] font-semibold text-[color:var(--vimi-faint)] tabular-nums">
        {count}
      </span>
      <span className="flex-1 h-px bg-[color:var(--vimi-border)]" />
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
        active
          ? "bg-[color:var(--vimi-ink)] text-[var(--vimi-page)]"
          : "bg-[color:rgba(28,27,31,0.05)] text-[color:var(--vimi-muted)] hover:bg-[color:rgba(28,27,31,0.09)]"
      }`}
    >
      {children}
    </button>
  );
}

function ScopePill({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        active
          ? "bg-[var(--vimi-card)] text-[color:var(--vimi-ink)] shadow-sm"
          : "text-[color:var(--vimi-muted)] hover:text-[color:var(--vimi-ink)]"
      }`}
    >
      {label}{" "}
      <span className="text-[color:var(--vimi-faint)]">({count})</span>
    </button>
  );
}

function TypeTag({ type }: { type: string }) {
  return (
    <span
      className={`shrink-0 text-[10px] font-bold tracking-[0.06em] rounded-md px-1.5 py-0.5 ${typeColors[type] ?? typeColors.other}`}
    >
      {typeLabel(type)}
    </span>
  );
}

function DueBadge({ dueDate, overdue }: { dueDate: string; overdue: boolean }) {
  return (
    <span
      className={`shrink-0 text-[11px] font-medium whitespace-nowrap ${
        overdue ? "text-red-600" : "text-[color:var(--vimi-muted)]"
      }`}
    >
      {overdue ? "Vencida " : "Entrega "}
      {dueDateShort(dueDate)}
    </span>
  );
}

function PausedChip() {
  return (
    <span className="shrink-0 inline-flex items-center rounded-full bg-[color:rgba(28,27,31,0.06)] text-[color:var(--vimi-muted)] text-[10px] font-medium px-1.5 py-0.5">
      Pausado
    </span>
  );
}

function PulseDot({ color }: { color: string }) {
  return (
    <span className="relative inline-flex items-center justify-center w-2 h-2">
      <span
        className="vm-pulse absolute inset-0 rounded-full"
        style={{ background: color }}
      />
      <span
        className="w-2 h-2 rounded-full relative"
        style={{ background: color }}
      />
    </span>
  );
}
