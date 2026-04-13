"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const REASONS = [
  { value: "billing", label: "Billing", suggestedDays: 7, hint: "Payment pending, contract renewal, trial ended" },
  { value: "client_on_hold", label: "Client on hold", suggestedDays: 14, hint: "Their vacation, life event, internal change" },
  { value: "scope_paused", label: "Scope paused", suggestedDays: 30, hint: "Waiting on decisions, phase transition" },
  { value: "studio_on_hold", label: "Studio on hold", suggestedDays: 14, hint: "Your vacation, over-capacity" },
  { value: "other", label: "Other", suggestedDays: null, hint: "Note required below" },
] as const;

interface PauseClientDialogProps {
  clientId: string;
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PauseClientDialog({
  clientId,
  clientName,
  open,
  onOpenChange,
}: PauseClientDialogProps) {
  const router = useRouter();
  const [reason, setReason] = useState<string>("");
  const [note, setNote] = useState("");
  const [resumeDate, setResumeDate] = useState("");
  const [visibleToClient, setVisibleToClient] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Suggested resume date based on chosen reason (Default Effect — sensible
  // default reduces decision fatigue, Zeigarnik — sets a target).
  const handleReasonChange = (value: string) => {
    setReason(value);
    const r = REASONS.find((r) => r.value === value);
    if (r?.suggestedDays && !resumeDate) {
      const d = new Date();
      d.setDate(d.getDate() + r.suggestedDays);
      setResumeDate(d.toISOString().slice(0, 10));
    }
  };

  const handlePause = async () => {
    if (!reason) {
      toast.error("Pick a reason");
      return;
    }
    if (reason === "other" && !note.trim()) {
      toast.error("Add a note for 'Other'");
      return;
    }
    setIsSaving(true);
    const res = await fetch(`/api/portal/admin/clients/${clientId}/pause`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason,
        note: note.trim() || null,
        paused_until: resumeDate ? new Date(resumeDate).toISOString() : null,
        visible_to_client: visibleToClient,
      }),
    });
    setIsSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Couldn't pause project");
      return;
    }
    toast.success(`${clientName} paused`);
    onOpenChange(false);
    setReason("");
    setNote("");
    setResumeDate("");
    setVisibleToClient(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Pause {clientName}</DialogTitle>
          <DialogDescription>
            They&apos;ll see a friendly &ldquo;paused&rdquo; page instead of the
            portal until you reactivate. Their data stays intact.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium tracking-wider text-muted-foreground">
              REASON
            </Label>
            <Select value={reason} onValueChange={handleReasonChange}>
              <SelectTrigger>
                <SelectValue placeholder="Pick a reason" />
              </SelectTrigger>
              <SelectContent position="popper" className="bg-white border shadow-lg z-50">
                {REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    <div className="flex flex-col py-0.5">
                      <span className="text-sm">{r.label}</span>
                      <span className="text-[11px] text-muted-foreground">{r.hint}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium tracking-wider text-muted-foreground">
              NOTE {reason === "other" && <span className="text-red-500">*</span>}
              <span className="ml-2 text-[10px] normal-case font-normal text-muted-foreground/70">
                admin-only by default
              </span>
            </Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Waiting on Q2 budget approval"
              rows={2}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium tracking-wider text-muted-foreground">
              RESUME ON
              <span className="ml-2 text-[10px] normal-case font-normal text-muted-foreground/70">
                optional — leave blank for indefinite
              </span>
            </Label>
            <Input
              type="date"
              value={resumeDate}
              onChange={(e) => setResumeDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
            />
          </div>

          <div className="flex items-start gap-3 pt-2 border-t">
            <Switch
              checked={visibleToClient}
              onCheckedChange={setVisibleToClient}
            />
            <div className="flex-1">
              <Label className="text-sm">Show reason to client</Label>
              <p className="text-[11px] text-muted-foreground">
                Off keeps the reason internal. Turn on for transparency
                (e.g. &ldquo;Studio on hold&rdquo; while you&apos;re on vacation).
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handlePause}
            disabled={isSaving || !reason}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {isSaving ? "Pausing..." : "Pause project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
