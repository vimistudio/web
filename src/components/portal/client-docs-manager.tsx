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
import { DOC_KINDS, docBadge, formatFileSize } from "@/lib/agreement";
import { sanitizeFileName } from "@/lib/files";

const MAX_BYTES = 50 * 1024 * 1024; // 50MB — docs, not video

// This dialog is Spanish per the design (the studio's own copy), independent of
// the client's locale. Kind values are stored unchanged; only the labels here
// are localized for the picker.
const KIND_LABELS_ES: Record<string, string> = {
  proposal: "Propuesta",
  plan: "Plan",
  manual: "Manual",
  contract: "Contrato",
  other: "Otro",
};

// Estado presets — write to status_label (free text) verbatim. Colors per spec.
const STATUS_PRESETS: { label: string; bg: string; color: string }[] = [
  { label: "FIRMADO", bg: "#E9F4EE", color: "#22754A" },
  { label: "EN CURSO", bg: "#E8EDFB", color: "#3554A8" },
  { label: "POR FIRMAR", bg: "#FFF3DE", color: "#B26F0E" },
  { label: "DÍA 30", bg: "#F1EEFB", color: "#5B4BD6" },
];

const presetFor = (label: string) =>
  STATUS_PRESETS.find((p) => p.label === label.trim().toUpperCase());

interface EditorDoc {
  key: string;
  id: string | null;
  kind: string;
  title: string;
  description: string;
  status_label: string;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  sort: number;
}

let draftSeq = 0;

// Thin sortable wrapper (render-prop) so each row keeps its inline handlers
// while gaining dnd-kit drag behavior. Mirrors plan-editor's SortableItem.
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

export function ClientDocsDialog({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<EditorDoc[]>([]);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [quickAdd, setQuickAdd] = useState("");
  const [showPreview, setShowPreview] = useState(false); // mobile toggle
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  // Autosave indicator: counts in-flight persists; amber "Guardando…" while any
  // is pending, green "Guardado" when settled. Mirrors plan-editor.
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
      map.forEach((tm) => clearTimeout(tm));
      map.clear();
    };
  }, []);

  // Load this client's documents when the dialog opens (admin RLS allows it).
  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    supabase
      .from("client_documents")
      .select(
        "id, kind, title, description, status_label, file_path, file_name, file_size, mime_type, sort"
      )
      .eq("client_id", clientId)
      .order("sort", { ascending: true })
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setRows(
          (data ?? []).map((d, i) => ({
            key: d.id,
            id: d.id,
            kind: d.kind,
            title: d.title,
            description: d.description ?? "",
            status_label: d.status_label ?? "",
            file_path: d.file_path,
            file_name: d.file_name,
            file_size: d.file_size,
            mime_type: d.mime_type,
            sort: d.sort ?? i,
          }))
        );
      });
  }, [open, clientId]);

  const patch = (key: string, changes: Partial<EditorDoc>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...changes } : r)));

  const toggleExpand = (key: string) =>
    setExpandedKey((prev) => (prev === key ? null : key));

  function textPayload(row: EditorDoc) {
    return {
      client_id: clientId,
      kind: row.kind,
      title: row.title.trim(),
      description: row.description.trim() || null,
      status_label: row.status_label.trim() || null,
      sort: row.sort,
    };
  }

  const maxSort = () =>
    rowsRef.current.reduce((m, r) => Math.max(m, r.sort), 0);

  // Persist an existing row's text fields. Skips empty titles (a title is
  // required) so mid-edit autosaves never blank out the row.
  async function persistRow(row: EditorDoc) {
    if (!row.id || !row.title.trim()) return;
    beginSave();
    const supabase = createClient();
    const { error } = await supabase
      .from("client_documents")
      .update(textPayload(row))
      .eq("id", row.id);
    endSave();
    if (error) {
      toast.error("No se pudo guardar el documento");
      return;
    }
    router.refresh();
  }

  // Immediate optimistic mutation (kind / status pills).
  function apply(key: string, changes: Partial<EditorDoc>) {
    const before = rowsRef.current.find((r) => r.key === key);
    if (!before) return;
    const merged = { ...before, ...changes };
    patch(key, changes);
    void persistRow(merged);
  }

  // Debounced text mutation (title / description); flushes on blur.
  function applyText(key: string, field: "title" | "description", value: string) {
    patch(key, { [field]: value } as Partial<EditorDoc>);
    const tk = `${key}:${field}`;
    const existing = timers.current.get(tk);
    if (existing) clearTimeout(existing);
    timers.current.set(
      tk,
      setTimeout(() => {
        timers.current.delete(tk);
        const row = rowsRef.current.find((r) => r.key === key);
        if (row) void persistRow(row);
      }, 800)
    );
  }

  function flushText(key: string, field: "title" | "description") {
    const tk = `${key}:${field}`;
    const existing = timers.current.get(tk);
    if (!existing) return;
    clearTimeout(existing);
    timers.current.delete(tk);
    const row = rowsRef.current.find((r) => r.key === key);
    if (row) void persistRow(row);
  }

  // Quick-add: create a placeholder row (no file) and expand it. Inserts
  // immediately so subsequent edits autosave via update.
  async function addRow(rawTitle: string) {
    const title = rawTitle.trim();
    if (!title) return;
    const tempKey = `draft-${(draftSeq += 1)}`;
    const sort = maxSort() + 1;
    const optimistic: EditorDoc = {
      key: tempKey,
      id: null,
      kind: "other",
      title,
      description: "",
      status_label: "",
      file_path: null,
      file_name: null,
      file_size: null,
      mime_type: null,
      sort,
    };
    setRows((prev) => [...prev, optimistic]);
    setQuickAdd("");
    setExpandedKey(tempKey);
    beginSave();
    const supabase = createClient();
    const { data, error } = await supabase
      .from("client_documents")
      .insert(textPayload(optimistic))
      .select("id")
      .single();
    endSave();
    if (error || !data) {
      setRows((prev) => prev.filter((r) => r.key !== tempKey));
      toast.error("No se pudo agregar el documento");
      return;
    }
    patch(tempKey, { id: data.id });
    router.refresh();
  }

  async function handleUpload(row: EditorDoc, file: File) {
    if (!row.title.trim()) {
      toast.error("Agrega un título antes de subir");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("El archivo supera el límite de 50MB");
      return;
    }
    setUploadingKey(row.key);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Storage key must be sanitized (rejects "×", spaces, accents, …); the
    // pretty original name is preserved in the file_name column below.
    const newPath = `${clientId}/${crypto.randomUUID()}/${sanitizeFileName(file.name)}`;
    const { error: upErr } = await supabase.storage
      .from("client-docs")
      .upload(newPath, file);
    if (upErr) {
      console.error("client-docs upload failed", upErr);
      toast.error(`Falló la subida: ${upErr.message}`);
      setUploadingKey(null);
      return;
    }

    const meta = {
      file_path: newPath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || null,
      uploaded_by: user?.id ?? null,
    };
    const oldPath = row.file_path;

    if (row.id) {
      const { error } = await supabase
        .from("client_documents")
        .update(meta)
        .eq("id", row.id);
      if (error) {
        console.error("client-docs metadata update failed", error);
        await supabase.storage.from("client-docs").remove([newPath]);
        toast.error(`No se pudo adjuntar el archivo: ${error.message}`);
        setUploadingKey(null);
        return;
      }
      // Replace: drop the previous object now that the row points at the new one.
      if (oldPath) await supabase.storage.from("client-docs").remove([oldPath]);
    } else {
      const { data, error } = await supabase
        .from("client_documents")
        .insert({ ...textPayload(row), ...meta })
        .select("id")
        .single();
      if (error || !data) {
        console.error("client-docs metadata insert failed", error);
        await supabase.storage.from("client-docs").remove([newPath]);
        toast.error(`No se pudo guardar${error ? `: ${error.message}` : ""}`);
        setUploadingKey(null);
        return;
      }
      patch(row.key, { id: data.id });
    }

    patch(row.key, {
      file_path: newPath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || null,
    });
    setUploadingKey(null);
    if (fileInputs.current[row.key]) fileInputs.current[row.key]!.value = "";
    toast.success("Archivo subido");
    router.refresh();
  }

  function handleDrop(row: EditorDoc, e: React.DragEvent) {
    e.preventDefault();
    setDraggingKey(null);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length === 0) return;
    if (dropped.length > 1) {
      toast.message("Un archivo por documento — se usa el primero");
    }
    handleUpload(row, dropped[0]);
  }

  async function deleteRow(row: EditorDoc) {
    if (!row.id) {
      setRows((prev) => prev.filter((r) => r.key !== row.key));
      return;
    }
    if (!window.confirm(`¿Eliminar "${row.title || "este documento"}"?`)) return;
    beginSave();
    const supabase = createClient();
    if (row.file_path) {
      await supabase.storage.from("client-docs").remove([row.file_path]);
    }
    const { error } = await supabase
      .from("client_documents")
      .delete()
      .eq("id", row.id);
    endSave();
    if (error) {
      toast.error("No se pudo eliminar el documento");
      return;
    }
    setRows((prev) => prev.filter((r) => r.key !== row.key));
    toast.success("Documento eliminado");
    router.refresh();
  }

  async function viewFile(row: EditorDoc) {
    if (!row.file_path) return;
    const supabase = createClient();
    const { data } = await supabase.storage
      .from("client-docs")
      .createSignedUrl(row.file_path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  }

  // Estado pill click: set verbatim, or clear if it's already the active value.
  function setStatus(row: EditorDoc, label: string) {
    const next = row.status_label.trim().toUpperCase() === label.toUpperCase() ? "" : label;
    apply(row.key, { status_label: next });
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  async function persistSorts(reordered: EditorDoc[]) {
    beginSave();
    const supabase = createClient();
    const results = await Promise.all(
      reordered
        .filter((r) => r.id)
        .map((r) =>
          supabase
            .from("client_documents")
            .update({ sort: r.sort })
            .eq("id", r.id as string)
        )
    );
    endSave();
    if (results.some((x) => x.error)) {
      toast.error("No se pudo reordenar");
      return;
    }
    router.refresh();
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldI = rows.findIndex((r) => r.key === active.id);
    const newI = rows.findIndex((r) => r.key === over.id);
    if (oldI < 0 || newI < 0) return;
    const reordered = arrayMove(rows, oldI, newI).map((r, i) => ({
      ...r,
      sort: i + 1,
    }));
    setRows(reordered);
    void persistSorts(reordered);
  }

  const saveColor = saving ? "#B26F0E" : "#2E8B57";
  const saveDot = saving ? "#C9821B" : "#2E8B57";
  const saveLabel = saving ? "Guardando…" : "Guardado";
  const hubCount = rows.length;

  const previewRows = useMemo(() => rows, [rows]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          Documents
        </Button>
      </DialogTrigger>
      <DialogContent
        className="w-[900px] max-w-[calc(100vw-2rem)] p-0 gap-0 border-0 overflow-hidden"
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
            padding: "22px 44px 14px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            flex: "none",
            borderBottom: "1px solid rgba(28,27,31,.07)",
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
              style={{ fontSize: 22, fontWeight: 400 }}
            >
              Documentos — {clientName}
            </DialogTitle>
            <span
              style={{ fontSize: 12, color: "var(--vimi-faint)", flex: "none" }}
            >
              {hubCount} en su hub
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
                style={{ width: 6, height: 6, borderRadius: 99, background: saveDot }}
              />
              {saveLabel}
            </span>
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="md:hidden"
              style={{
                border: "1px solid rgba(28,27,31,.16)",
                borderRadius: 99,
                padding: "5px 12px",
                fontSize: 11,
                fontWeight: 700,
                color: "var(--vimi-ink)",
                background: "transparent",
                cursor: "pointer",
                flex: "none",
              }}
            >
              {showPreview ? "Editor" : "Vista"}
            </button>
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--vimi-faint)" }}>
            Arrastra para ordenar · una fila sin archivo aparece como &ldquo;en
            preparación&rdquo; en el hub del cliente.
          </p>
        </div>

        {/* Body: editor (left) + client preview (right) */}
        <div className="flex-1 flex min-h-0">
          {/* ── EDITOR ─────────────────────────────────────────────── */}
          <div
            className={`${showPreview ? "hidden" : "flex"} md:flex flex-1 min-w-0 flex-col`}
            style={{
              padding: "16px 28px 24px",
              gap: 8,
              overflowY: "auto",
            }}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={rows.map((r) => r.key)}
                strategy={verticalListSortingStrategy}
              >
                {rows.map((row) => {
                  const isOpen = expandedKey === row.key;
                  const hasFile = !!row.file_path;
                  const badge = hasFile ? docBadge(row.mime_type, row.file_name) : "—";
                  const preset = presetFor(row.status_label);
                  const customStatus =
                    row.status_label.trim() && !preset ? row.status_label.trim() : "";
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
                          {/* Collapsed header — click toggles */}
                          <div
                            role="button"
                            tabIndex={0}
                            aria-expanded={isOpen}
                            onClick={() => toggleExpand(row.key)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggleExpand(row.key);
                              }
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "8px 12px",
                              minHeight: 44,
                              boxSizing: "border-box",
                              cursor: "pointer",
                            }}
                          >
                            <span
                              title="Arrastra para reordenar"
                              {...attributes}
                              {...listeners}
                              onClick={(e) => e.stopPropagation()}
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
                            <span
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 9,
                                flex: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 10,
                                fontWeight: 800,
                                letterSpacing: ".04em",
                                background: hasFile
                                  ? "color-mix(in srgb, var(--accent) 12%, #FFF)"
                                  : "rgba(28,27,31,.05)",
                                color: hasFile ? "var(--accent)" : "var(--vimi-faint)",
                              }}
                            >
                              {badge}
                            </span>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                minWidth: 0,
                                flex: 1,
                                gap: 1,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 13.5,
                                  fontWeight: 700,
                                  color: "var(--vimi-ink)",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {row.title.trim() || "Sin título"}
                              </span>
                              <span
                                style={{
                                  fontSize: 11.5,
                                  color: "var(--vimi-faint)",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {KIND_LABELS_ES[row.kind] ?? row.kind}
                                {hasFile
                                  ? ` · ${formatFileSize(row.file_size) || row.file_name}`
                                  : " · en preparación"}
                              </span>
                            </div>
                            {row.status_label.trim() && (
                              <span
                                style={{
                                  flex: "none",
                                  fontSize: 9.5,
                                  fontWeight: 800,
                                  letterSpacing: ".06em",
                                  textTransform: "uppercase",
                                  borderRadius: 6,
                                  padding: "3px 7px",
                                  background: preset ? preset.bg : "rgba(28,27,31,.06)",
                                  color: preset ? preset.color : "var(--vimi-muted)",
                                }}
                              >
                                {row.status_label}
                              </span>
                            )}
                            <span
                              aria-hidden="true"
                              style={{
                                flex: "none",
                                color: "var(--vimi-faint)",
                                fontSize: 11,
                                padding: 4,
                                transform: isOpen ? "rotate(180deg)" : "none",
                                transition: "transform .15s ease",
                              }}
                            >
                              ▾
                            </span>
                          </div>

                          {/* Expanded detail */}
                          {isOpen && (
                            <div
                              className="motion-safe:animate-in motion-safe:fade-in"
                              style={{
                                padding: "2px 14px 14px 44px",
                                display: "flex",
                                flexDirection: "column",
                                gap: 12,
                              }}
                            >
                              {/* Título + Tipo */}
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr",
                                  gap: 10,
                                }}
                              >
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                  <label
                                    style={{
                                      fontSize: 10.5,
                                      fontWeight: 700,
                                      letterSpacing: ".04em",
                                      color: "var(--vimi-faint)",
                                    }}
                                  >
                                    Título
                                  </label>
                                  <input
                                    value={row.title}
                                    onChange={(e) => applyText(row.key, "title", e.target.value)}
                                    onBlur={() => flushText(row.key, "title")}
                                    placeholder="Propuesta"
                                    style={{
                                      border: "1px solid rgba(28,27,31,.1)",
                                      borderRadius: 9,
                                      padding: "9px 11px",
                                      fontSize: 13,
                                      fontWeight: 600,
                                      outline: "none",
                                      background: "#FFF",
                                      color: "var(--vimi-ink)",
                                    }}
                                  />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                  <label
                                    style={{
                                      fontSize: 10.5,
                                      fontWeight: 700,
                                      letterSpacing: ".04em",
                                      color: "var(--vimi-faint)",
                                    }}
                                  >
                                    Tipo
                                  </label>
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {DOC_KINDS.map((k) => {
                                      const on = row.kind === k;
                                      return (
                                        <button
                                          key={k}
                                          onClick={() => apply(row.key, { kind: k })}
                                          aria-pressed={on}
                                          style={{
                                            border: `1px solid ${
                                              on ? "var(--accent)" : "rgba(28,27,31,.12)"
                                            }`,
                                            background: on
                                              ? "color-mix(in srgb, var(--accent) 8%, #FFF)"
                                              : "#FFF",
                                            color: on ? "var(--accent)" : "var(--vimi-muted)",
                                            borderRadius: 8,
                                            padding: "5px 11px",
                                            fontSize: 11.5,
                                            fontWeight: 700,
                                            cursor: "pointer",
                                          }}
                                        >
                                          {KIND_LABELS_ES[k]}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>

                              {/* Estado */}
                              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                <label
                                  style={{
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    letterSpacing: ".04em",
                                    color: "var(--vimi-faint)",
                                  }}
                                >
                                  Estado · el cliente lo ve tal cual
                                </label>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                  {STATUS_PRESETS.map((p) => {
                                    const on =
                                      row.status_label.trim().toUpperCase() === p.label;
                                    return (
                                      <button
                                        key={p.label}
                                        onClick={() => setStatus(row, p.label)}
                                        aria-pressed={on}
                                        style={{
                                          border: `1px solid ${
                                            on ? p.color : "rgba(28,27,31,.12)"
                                          }`,
                                          background: on ? p.bg : "#FFF",
                                          color: on ? p.color : "var(--vimi-muted)",
                                          borderRadius: 99,
                                          padding: "5px 12px",
                                          fontSize: 10.5,
                                          fontWeight: 800,
                                          letterSpacing: ".04em",
                                          cursor: "pointer",
                                        }}
                                      >
                                        {p.label}
                                      </button>
                                    );
                                  })}
                                  {customStatus && (
                                    // Existing custom status_label that matches no preset —
                                    // rendered as an active pill so it isn't lost. Click clears.
                                    <button
                                      onClick={() => setStatus(row, customStatus)}
                                      aria-pressed
                                      title="Estado personalizado — clic para quitar"
                                      style={{
                                        border: "1px solid var(--vimi-muted)",
                                        background: "rgba(28,27,31,.06)",
                                        color: "var(--vimi-muted)",
                                        borderRadius: 99,
                                        padding: "5px 12px",
                                        fontSize: 10.5,
                                        fontWeight: 800,
                                        letterSpacing: ".04em",
                                        cursor: "pointer",
                                        textTransform: "uppercase",
                                      }}
                                    >
                                      {customStatus}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Detalle para el cliente */}
                              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <label
                                  style={{
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    letterSpacing: ".04em",
                                    color: "var(--vimi-faint)",
                                  }}
                                >
                                  Detalle para el cliente
                                </label>
                                <input
                                  value={row.description}
                                  onChange={(e) =>
                                    applyText(row.key, "description", e.target.value)
                                  }
                                  onBlur={() => flushText(row.key, "description")}
                                  placeholder="PDF · 21 páginas · mayo 2026"
                                  style={{
                                    border: "1px solid rgba(28,27,31,.1)",
                                    borderRadius: 9,
                                    padding: "9px 11px",
                                    fontSize: 12.5,
                                    outline: "none",
                                    background: "#FFF",
                                    color: "var(--vimi-ink)",
                                  }}
                                />
                              </div>

                              {/* File zone */}
                              <div
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  setDraggingKey(row.key);
                                }}
                                onDragLeave={() =>
                                  setDraggingKey((k) => (k === row.key ? null : k))
                                }
                                onDrop={(e) => handleDrop(row, e)}
                              >
                                <input
                                  ref={(el) => {
                                    fileInputs.current[row.key] = el;
                                  }}
                                  type="file"
                                  accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUpload(row, file);
                                  }}
                                />
                                {hasFile ? (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 10,
                                      border: `1px solid ${
                                        draggingKey === row.key
                                          ? "var(--accent)"
                                          : "rgba(28,27,31,.1)"
                                      }`,
                                      borderRadius: 10,
                                      padding: "9px 11px",
                                      background:
                                        draggingKey === row.key
                                          ? "color-mix(in srgb, var(--accent) 5%, #FFF)"
                                          : "#FFF",
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: 99,
                                        background: "#2E8B57",
                                        flex: "none",
                                      }}
                                    />
                                    <div
                                      style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        minWidth: 0,
                                        flex: 1,
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: 12,
                                          fontFamily:
                                            "ui-monospace, SFMono-Regular, Menlo, monospace",
                                          color: "var(--vimi-ink)",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {row.file_name}
                                      </span>
                                      <span
                                        style={{ fontSize: 11, color: "var(--vimi-faint)" }}
                                      >
                                        {formatFileSize(row.file_size)}
                                        {" · "}
                                        {docBadge(row.mime_type, row.file_name)}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => viewFile(row)}
                                      style={{
                                        flex: "none",
                                        border: "1px solid rgba(28,27,31,.12)",
                                        background: "#FFF",
                                        borderRadius: 8,
                                        padding: "5px 11px",
                                        fontSize: 11.5,
                                        fontWeight: 700,
                                        color: "var(--vimi-ink)",
                                        cursor: "pointer",
                                      }}
                                    >
                                      Ver
                                    </button>
                                    <button
                                      onClick={() => fileInputs.current[row.key]?.click()}
                                      disabled={uploadingKey === row.key}
                                      style={{
                                        flex: "none",
                                        border: "1px solid rgba(28,27,31,.12)",
                                        background: "#FFF",
                                        borderRadius: 8,
                                        padding: "5px 11px",
                                        fontSize: 11.5,
                                        fontWeight: 700,
                                        color: "var(--vimi-muted)",
                                        cursor: "pointer",
                                      }}
                                    >
                                      {uploadingKey === row.key ? "Subiendo…" : "Reemplazar"}
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => fileInputs.current[row.key]?.click()}
                                    disabled={uploadingKey === row.key}
                                    style={{
                                      width: "100%",
                                      border: `1.5px dashed ${
                                        draggingKey === row.key
                                          ? "var(--accent)"
                                          : "rgba(28,27,31,.18)"
                                      }`,
                                      borderRadius: 10,
                                      padding: "12px 14px",
                                      fontSize: 12,
                                      fontWeight: 600,
                                      color: "var(--vimi-muted)",
                                      background:
                                        draggingKey === row.key
                                          ? "color-mix(in srgb, var(--accent) 5%, transparent)"
                                          : "rgba(255,255,255,.4)",
                                      cursor: "pointer",
                                      textAlign: "left",
                                    }}
                                  >
                                    {uploadingKey === row.key
                                      ? "Subiendo…"
                                      : "↑ Subir archivo · mientras tanto el cliente ve “en preparación”"}
                                  </button>
                                )}
                              </div>

                              {/* Footer */}
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                }}
                              >
                                <button
                                  onClick={() => deleteRow(row)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "#B03A5B",
                                    fontSize: 11.5,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    padding: "4px 0",
                                  }}
                                >
                                  Eliminar del hub
                                </button>
                                <span
                                  style={{
                                    marginLeft: "auto",
                                    fontSize: 11,
                                    color: "var(--vimi-faint)",
                                  }}
                                >
                                  Los cambios se guardan solos
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </SortableItem>
                  );
                })}
              </SortableContext>
            </DndContext>

            {/* Quick add */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "4px 12px",
                border: "1.5px dashed rgba(28,27,31,.12)",
                borderRadius: 13,
                background: "rgba(255,255,255,.4)",
              }}
            >
              <span style={{ color: "#C9C6CE", fontSize: 15, flex: "none" }}>+</span>
              <input
                value={quickAdd}
                onChange={(e) => setQuickAdd(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addRow(quickAdd);
                  }
                }}
                placeholder="Agregar documento — escribe el título y Enter"
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

          {/* ── CLIENT PREVIEW ─────────────────────────────────────── */}
          <aside
            aria-hidden="true"
            className={`${showPreview ? "block" : "hidden"} md:block w-full md:w-[300px] shrink-0 overflow-y-auto`}
            style={{
              background: "#EFEDE6",
              borderLeft: "1px solid rgba(28,27,31,.1)",
              padding: "20px 20px 24px",
            }}
          >
            <p
              style={{
                margin: "0 0 12px",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: "#6E6B75",
              }}
            >
              Así lo ve {clientName}
            </p>

            <div
              style={{
                background: "#F6F4EF",
                borderRadius: 16,
                padding: "18px 18px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <span className="font-serif italic" style={{ fontSize: 18 }}>
                Tus documentos
              </span>

              {previewRows.length === 0 ? (
                <p style={{ fontSize: 12.5, color: "var(--vimi-faint)", margin: 0 }}>
                  Aún no hay documentos.
                </p>
              ) : (
                previewRows.map((row) => {
                  const isPlaceholder = !row.file_path;
                  const preset = presetFor(row.status_label);
                  return (
                    <div
                      key={row.key}
                      style={{ display: "flex", gap: 11, alignItems: "flex-start" }}
                    >
                      <span
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 9,
                          flex: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: ".04em",
                          background: isPlaceholder
                            ? "rgba(28,27,31,.05)"
                            : "color-mix(in srgb, var(--accent) 12%, #FFF)",
                          color: isPlaceholder ? "var(--vimi-faint)" : "var(--accent)",
                        }}
                      >
                        {isPlaceholder ? "·30" : docBadge(row.mime_type, row.file_name)}
                      </span>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            justifyContent: "space-between",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "var(--vimi-ink)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {row.title.trim() || "Sin título"}
                          </span>
                          {!isPlaceholder && row.status_label.trim() && (
                            <span
                              style={{
                                flex: "none",
                                fontSize: 9,
                                fontWeight: 800,
                                letterSpacing: ".06em",
                                textTransform: "uppercase",
                                borderRadius: 5,
                                padding: "2px 6px",
                                background: preset ? preset.bg : "rgba(28,27,31,.06)",
                                color: preset ? preset.color : "var(--vimi-muted)",
                              }}
                            >
                              {row.status_label}
                            </span>
                          )}
                        </div>
                        {row.description.trim() && (
                          <span style={{ fontSize: 12, color: "var(--vimi-muted)", lineHeight: 1.4 }}>
                            {row.description}
                          </span>
                        )}
                        {isPlaceholder && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              fontSize: 10,
                              fontWeight: 800,
                              letterSpacing: ".08em",
                              color: "var(--vimi-faint)",
                            }}
                          >
                            <span
                              className="motion-safe:animate-pulse"
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: 99,
                                background: "var(--vimi-faint)",
                                flex: "none",
                              }}
                            />
                            EN PREPARACIÓN
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <p style={{ marginTop: 14, fontSize: 10, lineHeight: 1.5, color: "#6E6B75" }}>
              El orden de arriba es el orden que ve el cliente — arrastra las filas
              para cambiarlo.
            </p>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
