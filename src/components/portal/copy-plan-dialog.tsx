"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SourceClient {
  id: string;
  name: string;
  count: number;
}

interface CopyPlanDialogProps {
  clientId: string;
  clientName: string;
  currentCount: number;
  onCopied: () => void;
}

// Copy a month plan from any client that has milestones (including a paused
// "Plantilla" template client, or this client itself for a month rollover).
// A template is just a client with milestones — no separate plan_templates
// table, so the existing table/RLS/editor all apply unchanged.
export function CopyPlanDialog({
  clientId,
  clientName,
  currentCount,
  onCopied,
}: CopyPlanDialogProps) {
  const [open, setOpen] = useState(false);
  const [sources, setSources] = useState<SourceClient[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);
  const [sourceId, setSourceId] = useState<string>("");
  const [replace, setReplace] = useState(false);
  const [copying, setCopying] = useState(false);

  // Load the roster of clients-with-milestones when the dialog opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoadingSources(true);
      const supabase = createClient();
      // client_milestones → clients is a single-FK embed (safe; not a
      // profiles↔clients or requests↔profiles relationship).
      const { data } = await supabase
        .from("client_milestones")
        .select("client_id, clients(name)");
      if (cancelled) return;
      const grouped = new Map<string, SourceClient>();
      for (const row of data ?? []) {
        const name =
          (row as { clients?: { name?: string } | null }).clients?.name ??
          "Client";
        const existing = grouped.get(row.client_id);
        if (existing) existing.count += 1;
        else grouped.set(row.client_id, { id: row.client_id, name, count: 1 });
      }
      setSources(
        Array.from(grouped.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
      setLoadingSources(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const runCopy = useCallback(async () => {
    if (!sourceId) {
      toast.error("Pick a plan to copy from");
      return;
    }
    setCopying(true);
    const supabase = createClient();

    // Read the source plan. request_id / delay_note / client_done are always
    // reset, so they are not even read.
    const { data: sourceRows, error: readError } = await supabase
      .from("client_milestones")
      .select("track, week, title, description, needs_client, sort")
      .eq("client_id", sourceId)
      .order("week", { ascending: true })
      .order("sort", { ascending: true });

    if (readError || !sourceRows || sourceRows.length === 0) {
      setCopying(false);
      toast.error("Couldn't read that plan");
      return;
    }

    // Reset rules: fresh plan for a new month.
    //   status → upcoming, client_done → false, delay_note → null,
    //   request_id → null ALWAYS (links never carry across clients/months).
    const payload = sourceRows.map((r) => ({
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

    if (replace) {
      const { error: delError } = await supabase
        .from("client_milestones")
        .delete()
        .eq("client_id", clientId);
      if (delError) {
        setCopying(false);
        toast.error("Couldn't clear the current plan");
        return;
      }
    }

    const { error: insError } = await supabase
      .from("client_milestones")
      .insert(payload);

    setCopying(false);
    if (insError) {
      toast.error("Couldn't copy the plan");
      return;
    }
    toast.success(
      `Copied ${payload.length} milestone${payload.length === 1 ? "" : "s"} to ${clientName}`
    );
    setOpen(false);
    setSourceId("");
    setReplace(false);
    onCopied();
  }, [sourceId, replace, clientId, clientName, onCopied]);

  const selectedSource = sources.find((s) => s.id === sourceId) ?? null;
  const willReplace = replace && currentCount > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          Copy plan from…
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Copy plan — {clientName}</DialogTitle>
          <DialogDescription>
            Copy milestones from another client (or a template). Statuses reset
            to upcoming, client checkmarks clear, and request links are dropped.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Copy from</Label>
            <Select
              value={sourceId}
              onValueChange={setSourceId}
              disabled={loadingSources || sources.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingSources
                      ? "Loading…"
                      : sources.length === 0
                        ? "No plans to copy yet"
                        : "Pick a plan"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {sources.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                    {s.id === clientId ? " (this client)" : ""} · {s.count}{" "}
                    {s.count === 1 ? "milestone" : "milestones"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex flex-col">
              <Label htmlFor="replace-plan" className="text-sm">
                Replace current plan
              </Label>
              <span className="text-xs text-muted-foreground">
                {currentCount > 0
                  ? `Deletes the ${currentCount} existing milestone${currentCount === 1 ? "" : "s"} first`
                  : "This client has no milestones yet"}
              </span>
            </div>
            <Switch
              id="replace-plan"
              checked={replace}
              onCheckedChange={setReplace}
              disabled={currentCount === 0}
            />
          </div>

          {!replace && currentCount > 0 && selectedSource && (
            <p className="text-xs text-amber-600">
              This adds {selectedSource.count} milestone
              {selectedSource.count === 1 ? "" : "s"} on top of the current{" "}
              {currentCount}. Turn on “Replace current plan” to start fresh.
            </p>
          )}
        </div>

        <DialogFooter>
          {willReplace ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={!sourceId || copying}>
                  {copying ? "Copying…" : "Replace & copy"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Replace this plan?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This deletes the {currentCount} current milestone
                    {currentCount === 1 ? "" : "s"} for {clientName} and replaces
                    {selectedSource ? ` them with ${selectedSource.count} from ${selectedSource.name}` : ""}
                    . This can’t be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={runCopy}>
                    Replace & copy
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button onClick={runCopy} disabled={!sourceId || copying}>
              {copying ? "Copying…" : "Copy plan"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
