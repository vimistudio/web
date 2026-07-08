"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DOC_KINDS, formatFileSize } from "@/lib/agreement";
import { sanitizeFileName } from "@/lib/files";

const MAX_BYTES = 50 * 1024 * 1024; // 50MB — docs, not video

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

function blankDraft(): EditorDoc {
  draftSeq += 1;
  return {
    key: `draft-${draftSeq}`,
    id: null,
    kind: "other",
    title: "",
    description: "",
    status_label: "",
    file_path: null,
    file_name: null,
    file_size: null,
    mime_type: null,
    sort: 0,
  };
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
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

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
          (data ?? []).map((d) => ({
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
            sort: d.sort,
          }))
        );
      });
  }, [open, clientId]);

  const patch = (key: string, changes: Partial<EditorDoc>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...changes } : r)));

  const addRow = () => setRows((prev) => [...prev, blankDraft()]);

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

  async function saveRow(row: EditorDoc) {
    if (!row.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSavingKey(row.key);
    const supabase = createClient();
    if (row.id) {
      const { error } = await supabase
        .from("client_documents")
        .update(textPayload(row))
        .eq("id", row.id);
      setSavingKey(null);
      if (error) {
        toast.error("Couldn't save document");
        return;
      }
      toast.success("Document saved");
    } else {
      // Row with no file = "en preparación" placeholder (file_path stays null).
      const { data, error } = await supabase
        .from("client_documents")
        .insert(textPayload(row))
        .select("id")
        .single();
      setSavingKey(null);
      if (error || !data) {
        toast.error("Couldn't add document");
        return;
      }
      patch(row.key, { id: data.id });
      toast.success("Document added");
    }
    router.refresh();
  }

  async function handleUpload(row: EditorDoc, file: File) {
    if (!row.title.trim()) {
      toast.error("Add a title before uploading");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("File exceeds the 50MB limit");
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
      toast.error(`Upload failed: ${upErr.message}`);
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
        toast.error(`Couldn't attach file: ${error.message}`);
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
        toast.error(`Couldn't save document${error ? `: ${error.message}` : ""}`);
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
    toast.success("File uploaded");
    router.refresh();
  }

  function handleDrop(row: EditorDoc, e: React.DragEvent) {
    e.preventDefault();
    setDraggingKey(null);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length === 0) return;
    if (dropped.length > 1) {
      toast.message("One file per document — using the first one");
    }
    handleUpload(row, dropped[0]);
  }

  async function deleteRow(row: EditorDoc) {
    if (!row.id) {
      setRows((prev) => prev.filter((r) => r.key !== row.key));
      return;
    }
    if (!window.confirm(`Delete "${row.title || "this document"}"?`)) return;
    setSavingKey(row.key);
    const supabase = createClient();
    if (row.file_path) {
      await supabase.storage.from("client-docs").remove([row.file_path]);
    }
    const { error } = await supabase
      .from("client_documents")
      .delete()
      .eq("id", row.id);
    setSavingKey(null);
    if (error) {
      toast.error("Couldn't delete document");
      return;
    }
    setRows((prev) => prev.filter((r) => r.key !== row.key));
    toast.success("Document deleted");
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          Documents
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Documents — {clientName}</DialogTitle>
          <DialogDescription>
            Files show on the client&apos;s agreement hub. A row with no file is an
            &quot;en preparación&quot; placeholder. The status label is shown to the
            client verbatim (e.g. FIRMADO / EN CURSO / DÍA 30).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {rows.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No documents yet. Add the first one below.
            </p>
          )}

          {rows.map((row) => (
            <div
              key={row.key}
              className="rounded-lg border p-3 flex flex-col gap-3 bg-card"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Title</Label>
                  <Input
                    value={row.title}
                    onChange={(e) => patch(row.key, { title: e.target.value })}
                    placeholder="Propuesta"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Kind</Label>
                  <Select
                    value={row.kind}
                    onValueChange={(v) => patch(row.key, { kind: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" className="bg-white border shadow-lg z-50">
                      {DOC_KINDS.map((k) => (
                        <SelectItem key={k} value={k}>
                          {k}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Status label (verbatim)</Label>
                  <Input
                    value={row.status_label}
                    onChange={(e) =>
                      patch(row.key, { status_label: e.target.value })
                    }
                    placeholder="FIRMADO / EN CURSO / DÍA 30"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Sort</Label>
                  <Input
                    type="number"
                    value={row.sort}
                    onChange={(e) =>
                      patch(row.key, { sort: Number(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-xs">Description (client-facing meta)</Label>
                <Input
                  value={row.description}
                  onChange={(e) =>
                    patch(row.key, { description: e.target.value })
                  }
                  placeholder="PDF · 21 páginas · mayo 2026"
                />
              </div>

              {/* File cell — click-to-browse or drag-and-drop */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDraggingKey(row.key);
                }}
                onDragLeave={() => setDraggingKey((k) => (k === row.key ? null : k))}
                onDrop={(e) => handleDrop(row, e)}
                className={`flex flex-col gap-2 rounded-md border border-dashed p-2.5 transition-colors ${
                  draggingKey === row.key ? "border-primary bg-primary/5" : ""
                }`}
              >
                {row.file_path ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium truncate">
                        {row.file_name}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatFileSize(row.file_size)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs shrink-0"
                      onClick={() => viewFile(row)}
                    >
                      View
                    </Button>
                  </div>
                ) : (
                  <span className="text-[11px] text-muted-foreground">
                    No file — this shows as an &quot;en preparación&quot; placeholder.
                  </span>
                )}
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
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  disabled={uploadingKey === row.key}
                  onClick={() => fileInputs.current[row.key]?.click()}
                >
                  {uploadingKey === row.key
                    ? "Uploading…"
                    : row.file_path
                      ? "Replace file"
                      : "Upload file"}
                </Button>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-red-600 hover:text-red-700"
                  onClick={() => deleteRow(row)}
                  disabled={savingKey === row.key}
                >
                  Delete
                </Button>
                <Button
                  size="sm"
                  className="text-xs"
                  onClick={() => saveRow(row)}
                  disabled={savingKey === row.key}
                >
                  {savingKey === row.key ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={addRow} className="gap-2">
            Add document
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
