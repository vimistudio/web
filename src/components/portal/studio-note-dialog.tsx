"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Comment01Icon } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const SOFT_LIMIT = 140;

/**
 * Quick inline editor for a client's sidebar studio note. Lives on the admin
 * client board next to the Plan button so the studio can drop a line to the
 * client where they naturally work. Empty note clears it (NULL = hidden).
 */
export function StudioNoteDialog({
  clientId,
  studioNote,
}: {
  clientId: string;
  studioNote: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(studioNote ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const save = async (value: string) => {
    setIsSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("clients")
      .update({ studio_note: value.trim() || null })
      .eq("id", clientId);

    setIsSaving(false);
    if (error) {
      toast.error("Couldn't save the note. Please try again.");
      return;
    }
    toast.success(value.trim() ? "Note updated" : "Note cleared");
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Comment01Icon size={16} />
          Note to client
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Note to client</DialogTitle>
          <DialogDescription>
            A short, warm line shown in the client&apos;s sidebar. Write it in
            their language. Leave empty to hide it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 pt-2">
          <Label htmlFor="studio-note" className="sr-only">
            Studio note
          </Label>
          <Textarea
            id="studio-note"
            rows={3}
            placeholder="e.g. La auditoría va en marcha — sneak peek el jueves"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <p
            className={`text-xs text-right ${
              note.trim().length > SOFT_LIMIT
                ? "text-amber-600"
                : "text-muted-foreground"
            }`}
          >
            {note.trim().length}/{SOFT_LIMIT}
          </p>
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => save(note)}
            disabled={isSaving}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
          {studioNote && (
            <Button
              variant="outline"
              onClick={() => {
                setNote("");
                save("");
              }}
              disabled={isSaving}
            >
              Clear
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
