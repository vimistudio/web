"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

type Status = "upcoming" | "current" | "done";

interface EditorMilestone {
  key: string; // stable local key (row id, or temp for drafts)
  id: string | null; // null = not yet persisted
  track: string;
  week: number;
  title: string;
  description: string;
  status: Status;
  needs_client: boolean;
  request_id: string | null;
  sort: number;
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
  }[];
}

const NONE = "__none__";
let draftSeq = 0;

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
  };
}

function blankDraft(): EditorMilestone {
  draftSeq += 1;
  return {
    key: `draft-${draftSeq}`,
    id: null,
    track: "",
    week: 1,
    title: "",
    description: "",
    status: "upcoming",
    needs_client: false,
    request_id: null,
    sort: 0,
  };
}

export function PlanEditorDialog({ clientId, clientName, requests, milestones }: PlanEditorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<EditorMilestone[]>(() =>
    milestones.map(toEditor)
  );
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const patch = (key: string, changes: Partial<EditorMilestone>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...changes } : r)));

  const addRow = () => setRows((prev) => [...prev, blankDraft()]);

  async function saveRow(row: EditorMilestone) {
    if (!row.track.trim() || !row.title.trim()) {
      toast.error("Track and title are required");
      return;
    }
    setSavingKey(row.key);
    const supabase = createClient();
    const payload = {
      client_id: clientId,
      track: row.track.trim(),
      week: row.week,
      title: row.title.trim(),
      description: row.description.trim() || null,
      status: row.status,
      needs_client: row.needs_client,
      request_id: row.request_id,
      sort: row.sort,
    };

    if (row.id) {
      const { error } = await supabase
        .from("client_milestones")
        .update(payload)
        .eq("id", row.id);
      setSavingKey(null);
      if (error) {
        toast.error("Couldn't save milestone");
        return;
      }
      toast.success("Milestone saved");
    } else {
      const { data, error } = await supabase
        .from("client_milestones")
        .insert(payload)
        .select("id")
        .single();
      setSavingKey(null);
      if (error || !data) {
        toast.error("Couldn't add milestone");
        return;
      }
      patch(row.key, { id: data.id });
      toast.success("Milestone added");
    }
    router.refresh();
  }

  async function deleteRow(row: EditorMilestone) {
    if (!row.id) {
      setRows((prev) => prev.filter((r) => r.key !== row.key));
      return;
    }
    setSavingKey(row.key);
    const supabase = createClient();
    const { error } = await supabase
      .from("client_milestones")
      .delete()
      .eq("id", row.id);
    setSavingKey(null);
    if (error) {
      toast.error("Couldn't delete milestone");
      return;
    }
    setRows((prev) => prev.filter((r) => r.key !== row.key));
    toast.success("Milestone deleted");
    router.refresh();
  }

  // Group by week for display
  const weeks = Array.from(new Set(rows.map((r) => r.week))).sort((a, b) => a - b);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Plan — {clientName}</DialogTitle>
          <DialogDescription>
            Milestones drive the client&apos;s plan tracker. Week 5 shows as the final
            delivery. &quot;Needs client&quot; items appear in their amber to-do list.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          {rows.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No milestones yet. Add the first one below.
            </p>
          )}

          {weeks.map((week) => (
            <div key={week} className="flex flex-col gap-3">
              <div className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground">
                {week >= 5 ? "FINAL" : `WEEK ${String(week).padStart(2, "0")}`}
              </div>
              {rows
                .filter((r) => r.week === week)
                .map((row) => (
                  <div
                    key={row.key}
                    className="rounded-lg border p-3 flex flex-col gap-3 bg-card"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Track</Label>
                        <Input
                          value={row.track}
                          onChange={(e) => patch(row.key, { track: e.target.value })}
                          placeholder="La web"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Week</Label>
                        <Select
                          value={String(row.week)}
                          onValueChange={(v) => patch(row.key, { week: Number(v) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map((w) => (
                              <SelectItem key={w} value={String(w)}>
                                {w === 5 ? "5 (final)" : String(w)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Title</Label>
                      <Input
                        value={row.title}
                        onChange={(e) => patch(row.key, { title: e.target.value })}
                        placeholder="Wireframes for the homepage"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        rows={2}
                        value={row.description}
                        onChange={(e) => patch(row.key, { description: e.target.value })}
                        placeholder="Optional — shown on the current milestone"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Status</Label>
                        <Select
                          value={row.status}
                          onValueChange={(v) => patch(row.key, { status: v as Status })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="upcoming">Upcoming</SelectItem>
                            <SelectItem value="current">Current</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Sort</Label>
                        <Input
                          type="number"
                          value={row.sort}
                          onChange={(e) => patch(row.key, { sort: Number(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Linked request</Label>
                      <Select
                        value={row.request_id ?? NONE}
                        onValueChange={(v) =>
                          patch(row.key, { request_id: v === NONE ? null : v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>None</SelectItem>
                          {requests.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={row.needs_client}
                          onCheckedChange={(c) => patch(row.key, { needs_client: c })}
                          id={`needs-${row.key}`}
                        />
                        <Label htmlFor={`needs-${row.key}`} className="text-xs">
                          Needs client
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
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
                  </div>
                ))}
            </div>
          ))}

          <Button variant="outline" onClick={addRow} className="gap-2">
            Add milestone
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
