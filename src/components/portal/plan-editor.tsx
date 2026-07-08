"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
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
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Status = "upcoming" | "current" | "done" | "delayed";
type TabKey = "editor" | "templates" | "preview";

export interface EditorMilestone {
  key: string; // stable local key (row id, or temp for drafts)
  id: string | null; // null = insert in flight
  track: string;
  week: number;
  title: string;
  description: string;
  status: Status;
  needs_client: boolean;
  request_id: string | null;
  sort: number;
  delay_note: string;
}

interface RequestOption {
  id: string;
  title: string;
}

interface PlanEditorProps {
  clientId: string;
  clientName: string;
  requests: RequestOption[];
  milestones: {
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
  }[];
}

const NONE = "__none__";
const TEMPLATE_PREFIX = "Plantilla";
let draftSeq = 0;

// A plan source = any client that has milestones (a "Plantilla …" client is a
// studio template; everyone else copies as a client/month rollover).
interface SourceAgg {
  id: string;
  name: string; // raw client name
  displayName: string; // template prefix stripped for cards
  count: number;
  weeks: number; // distinct weeks spanned
  owed: number; // needs_client count
  isTemplate: boolean;
  isCurrent: boolean;
}

// Track chip palette — distinct hue per track label, assigned by order.
const TRACK_PALETTE = ["#5B4BD6", "#4064C9", "#2E8B57", "#C9821B", "#B03A5B", "#7A5CD0"];
const STANDARD_TRACKS = ["La web", "El sistema"];

const STATUS_TIP: Record<Status, string> = {
  upcoming: "Próximo · clic para marcar en curso",
  current: "En curso · clic para marcar hecho",
  done: "Hecho · clic para volver a próximo",
  delayed: "Se movió · clic para volver a en curso",
};

const MOVE_WEEKS = [
  { w: 1, name: "S1" },
  { w: 2, name: "S2" },
  { w: 3, name: "S3" },
  { w: 4, name: "S4" },
  { w: 5, name: "Final" },
];

// Milestones map onto a fixed 5-segment month rail (SEM 01-04 + a final
// bucket). Defensive clamp keeps stray week numbers in range.
const segOf = (week: number) => Math.min(5, Math.max(1, week));
const weekLabel = (w: number) =>
  w >= 5 ? "DÍA 30 · FINAL" : `SEMANA 0${w}`;

function toEditor(m: PlanEditorProps["milestones"][number]): EditorMilestone {
  return {
    key: m.id,
    id: m.id,
    track: m.track,
    week: m.week,
    title: m.title,
    description: m.description ?? "",
    status: (m.status as Status) ?? "upcoming",
    needs_client: m.needs_client,
    request_id: m.request_id,
    sort: m.sort,
    delay_note: m.delay_note ?? "",
  };
}

function statusDot(status: Status) {
  switch (status) {
    case "done":
      return { bg: "var(--status-done)", border: "var(--status-done)", mark: "✓" };
    case "current":
      return { bg: "var(--accent)", border: "var(--accent)", mark: "" };
    case "delayed":
      return { bg: "#B03A5B", border: "#B03A5B", mark: "" };
    default:
      return { bg: "transparent", border: "var(--vimi-faint)", mark: "" };
  }
}

// Thin sortable wrapper (render-prop) so each row keeps its inline handlers
// while gaining dnd-kit drag behavior. Stable at module scope → no remounts.
function SortableItem({
  id,
  children,
}: {
  id: string;
  children: (h: {
    setNodeRef: (el: HTMLElement | null) => void;
    style: React.CSSProperties;
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
  };
  return (
    <>
      {children({
        setNodeRef,
        style,
        attributes: attributes as unknown as Record<string, unknown>,
        listeners,
      })}
    </>
  );
}

export function PlanEditorDialog({
  clientId,
  clientName,
  requests,
  milestones,
}: PlanEditorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>("editor");
  const [rows, setRows] = useState<EditorMilestone[]>(() =>
    milestones.map(toEditor)
  );
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  // Autosave indicator: counts in-flight persists; amber "Guardando…" while
  // any is pending, green "Guardado" when settled.
  const savingRef = useRef(0);
  const [saving, setSaving] = useState(false);
  const beginSave = () => {
    savingRef.current += 1;
    setSaving(true);
  };
  const endSave = () => {
    savingRef.current = Math.max(0, savingRef.current - 1);
    if (savingRef.current === 0) setSaving(false);
  };

  const rowsRef = useRef(rows);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, []);

  const patch = (key: string, changes: Partial<EditorMilestone>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...changes } : r)));

  const trackOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const t of STANDARD_TRACKS) {
      if (!seen.has(t)) {
        seen.add(t);
        out.push(t);
      }
    }
    for (const r of rows) {
      const t = r.track?.trim();
      if (t && !seen.has(t)) {
        seen.add(t);
        out.push(t);
      }
    }
    return out;
  }, [rows]);

  const trackColor = (track: string) => {
    const i = trackOptions.indexOf(track);
    return TRACK_PALETTE[(i < 0 ? 0 : i) % TRACK_PALETTE.length];
  };

  const maxSortInWeek = (week: number) =>
    rowsRef.current
      .filter((r) => r.week === week)
      .reduce((m, r) => Math.max(m, r.sort), 0);

  const mostCommonTrack = (week: number) => {
    const counts = new Map<string, number>();
    for (const r of rowsRef.current.filter((x) => x.week === week)) {
      counts.set(r.track, (counts.get(r.track) ?? 0) + 1);
    }
    let best = "";
    let n = -1;
    counts.forEach((c, k) => {
      if (c > n) {
        n = c;
        best = k;
      }
    });
    return best || trackOptions[0] || "La web";
  };

  function buildPayload(row: EditorMilestone) {
    return {
      client_id: clientId,
      track: row.track.trim() || row.track,
      week: row.week,
      title: row.title.trim() || row.title,
      description: row.description.trim() || null,
      status: row.status,
      needs_client: row.needs_client,
      request_id: row.request_id,
      sort: row.sort,
      // client_done is deliberately not written here so the client's own
      // check-offs survive an admin edit.
      delay_note: row.status === "delayed" ? row.delay_note.trim() || null : null,
    };
  }

  async function reloadRows() {
    const supabase = createClient();
    const { data } = await supabase
      .from("client_milestones")
      .select("*")
      .eq("client_id", clientId)
      .order("week", { ascending: true })
      .order("sort", { ascending: true });
    if (data) setRows(data.map(toEditor));
  }

  // Persist a single row (must already exist in DB). On failure, re-sync from
  // the server so the optimistic UI reverts to the truth.
  async function persistRow(merged: EditorMilestone) {
    if (!merged.id) return;
    beginSave();
    const supabase = createClient();
    const { error } = await supabase
      .from("client_milestones")
      .update(buildPayload(merged))
      .eq("id", merged.id);
    endSave();
    if (error) {
      toast.error("No se pudo guardar el cambio");
      reloadRows();
      return;
    }
    router.refresh();
  }

  // Immediate optimistic mutation (status/track/toggles/week/request).
  function apply(key: string, changes: Partial<EditorMilestone>) {
    const before = rowsRef.current.find((r) => r.key === key);
    if (!before) return;
    const merged = { ...before, ...changes };
    patch(key, changes);
    void persistRow(merged);
  }

  // Debounced text mutation (title/description/delay_note). Patches live for
  // preview parity; flushes on blur.
  function applyText(key: string, field: "title" | "description" | "delay_note", value: string) {
    patch(key, { [field]: value } as Partial<EditorMilestone>);
    const tk = `${key}:${field}`;
    const existing = timers.current.get(tk);
    if (existing) clearTimeout(existing);
    timers.current.set(
      tk,
      setTimeout(() => {
        timers.current.delete(tk);
        const row = rowsRef.current.find((r) => r.key === key);
        if (row) void persistRow(row);
      }, 600)
    );
  }

  function flushText(key: string, field: "title" | "description" | "delay_note") {
    const tk = `${key}:${field}`;
    const existing = timers.current.get(tk);
    if (!existing) return;
    clearTimeout(existing);
    timers.current.delete(tk);
    const row = rowsRef.current.find((r) => r.key === key);
    if (row) void persistRow(row);
  }

  async function addMilestone(week: number, rawTitle: string) {
    const title = rawTitle.trim();
    if (!title) return;
    const tempKey = `draft-${(draftSeq += 1)}`;
    const track = mostCommonTrack(week);
    const sort = maxSortInWeek(week) + 1;
    const optimistic: EditorMilestone = {
      key: tempKey,
      id: null,
      track,
      week,
      title,
      description: "",
      status: "upcoming",
      needs_client: false,
      request_id: null,
      sort,
      delay_note: "",
    };
    setRows((prev) => [...prev, optimistic]);
    setDrafts((d) => ({ ...d, [week]: "" }));
    beginSave();
    const supabase = createClient();
    const { data, error } = await supabase
      .from("client_milestones")
      .insert({ ...buildPayload(optimistic), client_done: false })
      .select("*")
      .single();
    endSave();
    if (error || !data) {
      setRows((prev) => prev.filter((r) => r.key !== tempKey));
      toast.error("No se pudo agregar el hito");
      return;
    }
    setRows((prev) =>
      prev.map((r) => (r.key === tempKey ? { ...toEditor(data) } : r))
    );
    router.refresh();
  }

  async function deleteRow(row: EditorMilestone) {
    if (!row.id) {
      setRows((prev) => prev.filter((r) => r.key !== row.key));
      return;
    }
    const snapshot = rowsRef.current;
    setRows((prev) => prev.filter((r) => r.key !== row.key));
    beginSave();
    const supabase = createClient();
    const { error } = await supabase
      .from("client_milestones")
      .delete()
      .eq("id", row.id);
    endSave();
    if (error) {
      setRows(snapshot);
      toast.error("No se pudo eliminar el hito");
      return;
    }
    router.refresh();
  }

  function cycleStatus(row: EditorMilestone) {
    if (row.status === "delayed") {
      apply(row.key, { status: "current" });
      return;
    }
    const order: Status[] = ["upcoming", "current", "done"];
    const next = order[(order.indexOf(row.status) + 1) % order.length];
    apply(row.key, { status: next });
  }

  function cycleTrack(row: EditorMilestone) {
    if (trackOptions.length === 0) return;
    const i = trackOptions.indexOf(row.track);
    const next = trackOptions[(i + 1) % trackOptions.length];
    apply(row.key, { track: next });
  }

  function moveToWeek(row: EditorMilestone, week: number) {
    if (row.week === week) return;
    apply(row.key, { week, sort: maxSortInWeek(week) + 1 });
  }

  function toggleDelayed(row: EditorMilestone, on: boolean) {
    apply(row.key, { status: on ? "delayed" : "current" });
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  async function persistSorts(reordered: EditorMilestone[]) {
    beginSave();
    const supabase = createClient();
    const results = await Promise.all(
      reordered
        .filter((r) => r.id)
        .map((r) =>
          supabase
            .from("client_milestones")
            .update({ sort: r.sort })
            .eq("id", r.id as string)
        )
    );
    endSave();
    if (results.some((x) => x.error)) {
      toast.error("No se pudo reordenar");
      reloadRows();
      return;
    }
    router.refresh();
  }

  function handleDragEnd(week: number, e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const list = rowsByWeek(week);
    const oldI = list.findIndex((r) => r.key === active.id);
    const newI = list.findIndex((r) => r.key === over.id);
    if (oldI < 0 || newI < 0) return;
    const reordered = arrayMove(list, oldI, newI).map((r, i) => ({
      ...r,
      sort: i + 1,
    }));
    setRows((prev) =>
      prev.map((r) => {
        const u = reordered.find((x) => x.key === r.key);
        return u ? { ...r, sort: u.sort } : r;
      })
    );
    void persistSorts(reordered);
  }

  async function duplicateWeek(week: number) {
    if (week >= 5) return;
    const src = rowsByWeek(week);
    if (src.length === 0) return;
    const target = week + 1;
    const base = maxSortInWeek(target);
    const payload = src.map((r, i) => ({
      client_id: clientId,
      track: r.track,
      week: target,
      title: r.title,
      description: r.description.trim() || null,
      status: "upcoming",
      needs_client: r.needs_client,
      request_id: null,
      sort: base + i + 1,
      client_done: false,
      delay_note: null,
    }));
    beginSave();
    const supabase = createClient();
    const { data, error } = await supabase
      .from("client_milestones")
      .insert(payload)
      .select("*");
    endSave();
    if (error || !data) {
      toast.error("No se pudo duplicar la semana");
      return;
    }
    setRows((prev) => [...prev, ...data.map(toEditor)]);
    toast.success(
      `Se copiaron ${data.length} hito${data.length === 1 ? "" : "s"} a ${weekLabel(target)}`
    );
    router.refresh();
  }

  // ── Plantillas tab: roster of clients-with-milestones ──
  const [sources, setSources] = useState<SourceAgg[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);
  const [pendingSource, setPendingSource] = useState<SourceAgg | null>(null);

  useEffect(() => {
    if (!open || tab !== "templates") return;
    let cancelled = false;
    (async () => {
      setLoadingSources(true);
      const supabase = createClient();
      // Single-FK embed client_milestones → clients (safe, not a
      // profiles↔clients relationship).
      const { data } = await supabase
        .from("client_milestones")
        .select("client_id, week, needs_client, clients(name)");
      if (cancelled) return;
      const grouped = new Map<
        string,
        { name: string; count: number; weeks: Set<number>; owed: number }
      >();
      for (const row of data ?? []) {
        const name =
          (row as { clients?: { name?: string } | null }).clients?.name ??
          "Cliente";
        const g =
          grouped.get(row.client_id) ??
          { name, count: 0, weeks: new Set<number>(), owed: 0 };
        g.count += 1;
        g.weeks.add(segOf(row.week));
        if (row.needs_client) g.owed += 1;
        grouped.set(row.client_id, g);
      }
      const aggregated: SourceAgg[] = Array.from(grouped.entries()).map(
        ([id, g]) => {
          const isTemplate = g.name.startsWith(TEMPLATE_PREFIX);
          const displayName = isTemplate
            ? g.name.replace(/^Plantilla\s*[—-]\s*/, "").trim() || g.name
            : g.name;
          return {
            id,
            name: g.name,
            displayName,
            count: g.count,
            weeks: g.weeks.size,
            owed: g.owed,
            isTemplate,
            isCurrent: id === clientId,
          };
        }
      );
      setSources(aggregated.sort((a, b) => a.name.localeCompare(b.name)));
      setLoadingSources(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, tab, clientId]);

  async function applyPlan(source: SourceAgg, mode: "replace" | "add") {
    setPendingSource(null);
    const supabase = createClient();
    // request_id / delay_note / client_done are always reset, so not even read.
    const { data: srcRows, error: readErr } = await supabase
      .from("client_milestones")
      .select("track, week, title, description, needs_client, sort")
      .eq("client_id", source.id)
      .order("week", { ascending: true })
      .order("sort", { ascending: true });
    if (readErr || !srcRows || srcRows.length === 0) {
      toast.error("No se pudo leer ese plan");
      return;
    }
    const payload = srcRows.map((r) => ({
      client_id: clientId,
      track: r.track,
      week: r.week,
      title: r.title,
      description: r.description,
      status: "upcoming",
      needs_client: r.needs_client,
      client_done: false,
      delay_note: null,
      request_id: null,
      sort: r.sort,
    }));
    beginSave();
    if (mode === "replace") {
      const { error: delErr } = await supabase
        .from("client_milestones")
        .delete()
        .eq("client_id", clientId);
      if (delErr) {
        endSave();
        toast.error("No se pudo limpiar el plan actual");
        return;
      }
    }
    const { error: insErr } = await supabase
      .from("client_milestones")
      .insert(payload);
    endSave();
    if (insErr) {
      toast.error("No se pudo aplicar el plan");
      reloadRows();
      return;
    }
    toast.success(
      `Se aplicaron ${payload.length} hito${payload.length === 1 ? "" : "s"}`
    );
    await reloadRows();
    setTab("editor");
    router.refresh();
  }

  function onApplyClick(source: SourceAgg) {
    if (rows.length > 0) setPendingSource(source);
    else applyPlan(source, "add");
  }

  const toggleExpand = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // Current week gets the AHORA chip: lowest week with unfinished work.
  const currentWeek = useMemo(() => {
    const openW = rows.filter((r) => r.status !== "done").map((r) => segOf(r.week));
    if (openW.length > 0) return Math.min(...openW);
    const allW = rows.map((r) => segOf(r.week));
    return allW.length > 0 ? Math.max(...allW) : 1;
  }, [rows]);

  const total = rows.length;
  const doneCount = rows.filter((r) => r.status === "done").length;
  const owedCount = rows.filter((r) => r.needs_client).length;

  const progressPct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const previewItems = useMemo(
    () =>
      rows
        .filter((r) => segOf(r.week) === currentWeek)
        .sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title)),
    [rows, currentWeek]
  );

  const templates = useMemo(
    () => sources.filter((s) => s.isTemplate && s.count > 0),
    [sources]
  );
  const otherClients = useMemo(
    () => sources.filter((s) => !s.isTemplate && s.count > 0),
    [sources]
  );

  const rowsByWeek = (w: number) =>
    rows
      .filter((r) => segOf(r.week) === w)
      .sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title));

  const saveColor = saving ? "#B26F0E" : "#2E8B57";
  const saveDot = saving ? "#C9821B" : "#2E8B57";
  const saveLabel = saving ? "Guardando…" : "Guardado";

  const tabBtn = (key: TabKey, label: string) => {
    const active = tab === key;
    return (
      <button
        key={key}
        onClick={() => setTab(key)}
        style={{
          border: "none",
          borderRadius: 99,
          padding: "8px 16px",
          fontSize: 12.5,
          fontWeight: 700,
          cursor: "pointer",
          background: active ? "#FFFFFF" : "transparent",
          color: active ? "var(--vimi-ink)" : "var(--vimi-muted)",
          boxShadow: active ? "0 1px 3px rgba(28,27,31,.12)" : "none",
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          Plan
        </Button>
      </DialogTrigger>
      <DialogContent
        className="w-[760px] max-w-[calc(100vw-2rem)] p-0 gap-0 border-0 overflow-hidden"
        style={{
          background: "#F6F4EF",
          borderRadius: 24,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "22px 44px 0 28px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            flex: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                width: 11,
                height: 11,
                borderRadius: 4,
                background: "var(--accent)",
                flex: "none",
              }}
            />
            <DialogTitle
              className="font-serif italic"
              style={{ fontSize: 23, fontWeight: 400 }}
            >
              Plan — {clientName}
            </DialogTitle>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: ".1em",
                color: "var(--vimi-faint)",
              }}
            >
              MES 01
            </span>
            <span
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontSize: 12,
                fontWeight: 600,
                color: saveColor,
                transition: "color .3s ease",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 99,
                  background: saveDot,
                }}
              />
              {saveLabel}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                display: "flex",
                background: "rgba(28,27,31,.06)",
                borderRadius: 99,
                padding: 3,
                gap: 2,
              }}
            >
              {tabBtn("editor", "Plan")}
              {tabBtn("templates", "Plantillas")}
              {tabBtn("preview", "Lo que ve el cliente")}
            </div>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 12,
                color: "var(--vimi-faint)",
              }}
            >
              {doneCount} de {total} hitos · {owedCount} del cliente
            </span>
          </div>
          <div style={{ height: 1, background: "rgba(28,27,31,.07)" }} />
        </div>

        {/* TAB: EDITOR */}
        {tab === "editor" && (
          <div
            style={{
              padding: "14px 28px 26px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              overflowY: "auto",
              flex: 1,
            }}
          >
            {[1, 2, 3, 4, 5].map((w) => {
              const weekRows = rowsByWeek(w);
              const isCurrent = w === currentWeek;
              return (
                <div key={w}>
                  {/* week header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "16px 2px 8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        letterSpacing: ".14em",
                        color: isCurrent ? "var(--vimi-ink)" : "var(--vimi-faint)",
                      }}
                    >
                      {weekLabel(w)}
                    </span>
                    {isCurrent && (
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 800,
                          letterSpacing: ".08em",
                          background: "var(--accent)",
                          color: "#FFF",
                          borderRadius: 5,
                          padding: "3px 7px",
                        }}
                      >
                        AHORA
                      </span>
                    )}
                    <span
                      style={{ flex: 1, height: 1, background: "rgba(28,27,31,.07)" }}
                    />
                    {w < 5 && weekRows.length > 0 && (
                      <button
                        onClick={() => duplicateWeek(w)}
                        title="Duplicar semana"
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--vimi-faint)",
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: "pointer",
                          padding: "4px 8px",
                          borderRadius: 7,
                        }}
                      >
                        ⧉ duplicar
                      </button>
                    )}
                  </div>

                  {/* rows */}
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(e) => handleDragEnd(w, e)}
                  >
                    <SortableContext
                      items={weekRows.map((r) => r.key)}
                      strategy={verticalListSortingStrategy}
                    >
                      {weekRows.map((row) => {
                    const dot = statusDot(row.status);
                    const isOpen = expanded.has(row.key);
                    const tc = trackColor(row.track);
                    return (
                      <SortableItem key={row.key} id={row.key}>
                        {({ setNodeRef, style, attributes, listeners }) => (
                      <div
                        ref={setNodeRef}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          background: "#FFFFFF",
                          border: "1.5px solid rgba(28,27,31,.08)",
                          borderRadius: 13,
                          marginBottom: 5,
                          ...style,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "9px 12px",
                            minHeight: 44,
                            boxSizing: "border-box",
                          }}
                        >
                          <span
                            title="Arrastra para reordenar"
                            {...attributes}
                            {...listeners}
                            style={{
                              color: "#C9C6CE",
                              fontSize: 13,
                              cursor: "grab",
                              flex: "none",
                              padding: 2,
                              touchAction: "none",
                            }}
                          >
                            ⠿
                          </span>
                          <button
                            onClick={() => cycleStatus(row)}
                            title={STATUS_TIP[row.status]}
                            aria-label={STATUS_TIP[row.status]}
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 99,
                              border: `2px solid ${dot.border}`,
                              background: dot.bg,
                              cursor: "pointer",
                              flex: "none",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 11,
                              color: "#FFF",
                              padding: 0,
                            }}
                          >
                            {dot.mark}
                          </button>
                          <button
                            onClick={() => cycleTrack(row)}
                            title="Cambiar de track"
                            style={{
                              fontSize: 9.5,
                              fontWeight: 800,
                              letterSpacing: ".06em",
                              background: `color-mix(in srgb, ${tc} 14%, #FFF)`,
                              color: tc,
                              border: "none",
                              borderRadius: 5,
                              padding: "4px 7px",
                              cursor: "pointer",
                              flex: "none",
                              textTransform: "uppercase",
                            }}
                          >
                            {row.track || "track"}
                          </button>
                          <input
                            value={row.title}
                            onChange={(e) => applyText(row.key, "title", e.target.value)}
                            onBlur={() => flushText(row.key, "title")}
                            style={{
                              flex: 1,
                              minWidth: 0,
                              border: "none",
                              background: "transparent",
                              fontSize: 13.5,
                              fontWeight: 600,
                              color:
                                row.status === "done"
                                  ? "var(--vimi-muted)"
                                  : "var(--vimi-ink)",
                              outline: "none",
                              textDecoration:
                                row.status === "done" ? "line-through" : "none",
                              padding: "4px 0",
                            }}
                          />
                          <button
                            onClick={() =>
                              apply(row.key, { needs_client: !row.needs_client })
                            }
                            title="El cliente debe completarlo"
                            style={{
                              fontSize: 9.5,
                              fontWeight: 800,
                              letterSpacing: ".06em",
                              border: `1.5px solid ${
                                row.needs_client
                                  ? "var(--status-review)"
                                  : "rgba(28,27,31,.14)"
                              }`,
                              background: row.needs_client
                                ? "var(--status-review-chip)"
                                : "transparent",
                              color: row.needs_client
                                ? "var(--status-review-ink)"
                                : "var(--vimi-faint)",
                              borderRadius: 99,
                              padding: "4px 9px",
                              cursor: "pointer",
                              flex: "none",
                            }}
                          >
                            CLIENTE
                          </button>
                          <button
                            onClick={() => toggleExpand(row.key)}
                            aria-label={isOpen ? "Contraer" : "Expandir"}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--vimi-faint)",
                              fontSize: 11,
                              cursor: "pointer",
                              flex: "none",
                              padding: 4,
                              transform: isOpen ? "rotate(180deg)" : "none",
                              transition: "transform .15s ease",
                            }}
                          >
                            ▾
                          </button>
                        </div>

                        {/* expanded detail */}
                        {isOpen && (
                          <div
                            className="motion-safe:animate-in motion-safe:fade-in"
                            style={{
                              padding: "2px 14px 14px 44px",
                              display: "flex",
                              flexDirection: "column",
                              gap: 10,
                            }}
                          >
                            <textarea
                              value={row.description}
                              onChange={(e) =>
                                applyText(row.key, "description", e.target.value)
                              }
                              onBlur={() => flushText(row.key, "description")}
                              placeholder="Descripción — visible para el cliente"
                              rows={2}
                              style={{
                                border: "1px solid rgba(28,27,31,.1)",
                                borderRadius: 10,
                                padding: "10px 12px",
                                fontSize: 12.5,
                                outline: "none",
                                background: "#FFF",
                                color: "var(--vimi-ink)",
                                resize: "vertical",
                                lineHeight: 1.5,
                              }}
                            />

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                flexWrap: "wrap",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: "var(--vimi-faint)",
                                }}
                              >
                                Mover a
                              </span>
                              {MOVE_WEEKS.map((mw) => {
                                const here = segOf(row.week) === mw.w;
                                return (
                                  <button
                                    key={mw.w}
                                    onClick={() => moveToWeek(row, mw.w)}
                                    style={{
                                      border: `1px solid ${
                                        here ? "var(--accent)" : "rgba(28,27,31,.12)"
                                      }`,
                                      background: here
                                        ? "color-mix(in srgb, var(--accent) 8%, #FFF)"
                                        : "#FFF",
                                      color: here ? "var(--accent)" : "var(--vimi-muted)",
                                      borderRadius: 8,
                                      padding: "5px 10px",
                                      fontSize: 11,
                                      fontWeight: 700,
                                      cursor: "pointer",
                                    }}
                                  >
                                    {mw.name}
                                  </button>
                                );
                              })}
                              <button
                                onClick={() => deleteRow(row)}
                                style={{
                                  marginLeft: "auto",
                                  background: "none",
                                  border: "none",
                                  color: "#B03A5B",
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  padding: "5px 8px",
                                  borderRadius: 7,
                                }}
                              >
                                Eliminar
                              </button>
                            </div>

                            {/* system fields the prototype omits */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                flexWrap: "wrap",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: "var(--vimi-faint)",
                                }}
                              >
                                Tarjeta
                              </span>
                              <div style={{ minWidth: 220 }}>
                                <Select
                                  value={row.request_id ?? NONE}
                                  onValueChange={(v) =>
                                    apply(row.key, {
                                      request_id: v === NONE ? null : v,
                                    })
                                  }
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Sin tarjeta vinculada" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={NONE}>
                                      Sin tarjeta vinculada
                                    </SelectItem>
                                    {requests.map((r) => (
                                      <SelectItem key={r.id} value={r.id}>
                                        {r.title}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                onClick={() =>
                                  toggleDelayed(row, row.status !== "delayed")
                                }
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  border: `1.5px solid ${
                                    row.status === "delayed"
                                      ? "#B03A5B"
                                      : "rgba(28,27,31,.12)"
                                  }`,
                                  background:
                                    row.status === "delayed"
                                      ? "rgba(176,58,91,.08)"
                                      : "#FFF",
                                  color:
                                    row.status === "delayed"
                                      ? "#B03A5B"
                                      : "var(--vimi-muted)",
                                  borderRadius: 8,
                                  padding: "5px 10px",
                                  cursor: "pointer",
                                }}
                              >
                                Se movió
                              </button>
                              {row.status === "delayed" && (
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: "var(--vimi-faint)",
                                  }}
                                >
                                  Nota requerida <span style={{ color: "#B03A5B" }}>*</span>
                                </span>
                              )}
                            </div>
                            {row.status === "delayed" && (
                              <textarea
                                value={row.delay_note}
                                onChange={(e) =>
                                  applyText(row.key, "delay_note", e.target.value)
                                }
                                onBlur={() => flushText(row.key, "delay_note")}
                                placeholder="Por qué se movió — visible para el cliente"
                                rows={2}
                                style={{
                                  border: "1px solid rgba(176,58,91,.3)",
                                  borderRadius: 10,
                                  padding: "10px 12px",
                                  fontSize: 12.5,
                                  outline: "none",
                                  background: "#FFF",
                                  color: "var(--vimi-ink)",
                                  resize: "vertical",
                                  lineHeight: 1.5,
                                }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                        )}
                      </SortableItem>
                    );
                  })}
                    </SortableContext>
                  </DndContext>

                  {/* quick add */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "4px 12px 2px",
                      border: "1.5px dashed rgba(28,27,31,.12)",
                      borderRadius: 13,
                      marginBottom: 4,
                      background: "rgba(255,255,255,.4)",
                    }}
                  >
                    <span style={{ color: "#C9C6CE", fontSize: 14, flex: "none" }}>
                      +
                    </span>
                    <input
                      value={drafts[w] ?? ""}
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [w]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addMilestone(w, drafts[w] ?? "");
                        }
                      }}
                      placeholder={`Agregar hito a ${weekLabel(w).toLowerCase()}`}
                      style={{
                        flex: 1,
                        border: "none",
                        background: "transparent",
                        fontSize: 13,
                        fontWeight: 500,
                        outline: "none",
                        padding: "11px 0",
                        color: "var(--vimi-ink)",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 10.5,
                        color: "#C9C6CE",
                        flex: "none",
                        fontWeight: 600,
                      }}
                    >
                      ↵ Enter
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB: TEMPLATES */}
        {tab === "templates" && (
          <div
            style={{
              padding: "20px 28px 28px",
              display: "flex",
              flexDirection: "column",
              gap: 18,
              flex: 1,
              overflowY: "auto",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 13.5,
                color: "var(--vimi-muted)",
                lineHeight: 1.55,
                maxWidth: 520,
              }}
            >
              Nunca armes un plan desde cero. Aplica una plantilla del estudio o
              copia el plan de otro cliente — después ajustas los detalles en el
              editor.
            </p>

            {loadingSources && (
              <p style={{ fontSize: 13, color: "var(--vimi-faint)" }}>Cargando…</p>
            )}

            <div
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: ".14em",
                color: "var(--vimi-faint)",
              }}
            >
              PLANTILLAS DEL ESTUDIO
            </div>
            {templates.length === 0 && !loadingSources ? (
              <p style={{ fontSize: 13, color: "var(--vimi-faint)" }}>
                Aún no hay plantillas del estudio.
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                {templates.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      background: "#FFFFFF",
                      border: "1.5px solid rgba(28,27,31,.08)",
                      borderRadius: 16,
                      padding: 18,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 4,
                          background: "var(--accent)",
                          flex: "none",
                        }}
                      />
                      <span style={{ fontSize: 14.5, fontWeight: 700 }}>
                        {t.displayName}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        fontSize: 11.5,
                        color: "var(--vimi-faint)",
                      }}
                    >
                      <span>
                        <b style={{ color: "var(--vimi-ink)" }}>{t.count}</b> hitos
                      </span>
                      <span>{t.weeks} semanas</span>
                      <span>{t.owed} del cliente</span>
                    </div>
                    <button
                      onClick={() => onApplyClick(t)}
                      style={{
                        marginTop: 4,
                        background: "var(--vimi-ink)",
                        color: "#FFF",
                        border: "1.5px solid var(--vimi-ink)",
                        borderRadius: 10,
                        padding: 10,
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Aplicar plantilla
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: ".14em",
                color: "var(--vimi-faint)",
                marginTop: 4,
              }}
            >
              O COPIAR DE OTRO CLIENTE
            </div>
            {otherClients.length === 0 && !loadingSources ? (
              <p style={{ fontSize: 13, color: "var(--vimi-faint)" }}>
                No hay otros planes para copiar.
              </p>
            ) : (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {otherClients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onApplyClick(c)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      background: "#FFFFFF",
                      border: "1px solid rgba(28,27,31,.1)",
                      borderRadius: 99,
                      padding: "10px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: 3,
                        background: c.isCurrent ? "var(--accent)" : "var(--vimi-faint)",
                      }}
                    />
                    {c.isCurrent ? `${c.displayName} (mes anterior)` : c.displayName}
                    <span style={{ color: "var(--vimi-faint)", fontWeight: 500 }}>
                      · {c.count} hito{c.count === 1 ? "" : "s"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: CLIENT PREVIEW — derived live from editor state */}
        {tab === "preview" && (
          <div
            style={{
              padding: "20px 28px 28px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              flex: 1,
              overflowY: "auto",
            }}
          >
            <p style={{ margin: 0, fontSize: 12.5, color: "var(--vimi-faint)" }}>
              Exactamente lo que {clientName} ve en su tablero — se actualiza en
              vivo con cada cambio del plan.
            </p>
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(28,27,31,.08)",
                borderRadius: 18,
                padding: "22px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  className="font-serif italic"
                  style={{ fontSize: 19 }}
                >
                  Tu plan del mes 01
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: ".1em",
                    color: "var(--vimi-muted)",
                  }}
                >
                  SEMANA {Math.min(4, currentWeek)} DE 4
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--accent)",
                  }}
                >
                  {progressPct}% completado
                </span>
              </div>
              <div
                style={{
                  height: 5,
                  borderRadius: 99,
                  background: "rgba(28,27,31,.07)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progressPct}%`,
                    borderRadius: 99,
                    background: "var(--accent)",
                    transition: "width .4s ease",
                  }}
                />
              </div>
              {previewItems.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--vimi-faint)" }}>
                  Aún no hay hitos en esta semana.
                </p>
              ) : (
                previewItems.map((p) => {
                  const color =
                    p.status === "done"
                      ? "var(--status-done)"
                      : p.status === "current"
                        ? "var(--accent)"
                        : p.status === "delayed"
                          ? "#B03A5B"
                          : "var(--vimi-faint)";
                  return (
                    <div
                      key={p.key}
                      style={{ display: "flex", gap: 11, alignItems: "flex-start" }}
                    >
                      <span
                        className={
                          p.status === "current" ? "motion-safe:animate-pulse" : ""
                        }
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 99,
                          background: color,
                          marginTop: 5,
                          flex: "none",
                        }}
                      />
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 9.5,
                              fontWeight: 800,
                              letterSpacing: ".08em",
                              background: "rgba(28,27,31,.06)",
                              borderRadius: 5,
                              padding: "3px 6px",
                              color: "var(--vimi-muted)",
                              textTransform: "uppercase",
                            }}
                          >
                            {p.track}
                          </span>
                          <span
                            style={{
                              fontSize: 13.5,
                              fontWeight: 700,
                              textDecoration:
                                p.status === "done" ? "line-through" : "none",
                              color:
                                p.status === "done"
                                  ? "var(--vimi-muted)"
                                  : "var(--vimi-ink)",
                            }}
                          >
                            {p.title || "Sin título"}
                          </span>
                          {p.needs_client && (
                            <span
                              style={{
                                fontSize: 9.5,
                                fontWeight: 800,
                                letterSpacing: ".06em",
                                background: "var(--status-review-chip)",
                                color: "var(--status-review-ink)",
                                borderRadius: 5,
                                padding: "3px 6px",
                              }}
                            >
                              TE TOCA
                            </span>
                          )}
                        </div>
                        {p.description.trim() && (
                          <span
                            style={{
                              fontSize: 12,
                              color: "var(--vimi-faint)",
                              lineHeight: 1.5,
                            }}
                          >
                            {p.description}
                          </span>
                        )}
                        {p.status === "delayed" && p.delay_note.trim() && (
                          <span
                            style={{
                              fontSize: 12,
                              color: "#B03A5B",
                              lineHeight: 1.5,
                              fontWeight: 500,
                            }}
                          >
                            {p.delay_note}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Replace-vs-add confirmation when the target plan is non-empty */}
        <AlertDialog
          open={pendingSource !== null}
          onOpenChange={(o) => {
            if (!o) setPendingSource(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {clientName} ya tiene un plan
              </AlertDialogTitle>
              <AlertDialogDescription>
                Este cliente ya tiene {total} hito{total === 1 ? "" : "s"}.
                {pendingSource
                  ? ` ¿Reemplazarlo con ${pendingSource.count} de ${pendingSource.displayName}, o agregarlos al plan actual?`
                  : ""}{" "}
                Reemplazar borra los hitos actuales y no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  pendingSource && applyPlan(pendingSource, "add")
                }
              >
                Agregar al plan
              </AlertDialogAction>
              <AlertDialogAction
                onClick={() =>
                  pendingSource && applyPlan(pendingSource, "replace")
                }
                style={{ background: "#B03A5B" }}
              >
                Reemplazar ({total})
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
