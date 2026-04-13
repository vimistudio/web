"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  PenToolIcon,
} from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface DirectionDeliverable {
  id: string;
  file_name: string;
  mime_type: string | null;
  url: string | null;
  direction_label: string | null;
  direction_description: string | null;
  direction_order: number | null;
  is_recommended: boolean;
}

interface DirectionOrganizerProps {
  deliverables: DirectionDeliverable[];
  requestId: string;
  votingMode: string | null;
  onUpdate: () => void;
  /** Source table for direction metadata. Defaults to "deliverables". */
  entityTable?: "deliverables" | "social_posts";
  /** Heading override (e.g. "Present carousels as Directions"). */
  heading?: string;
}

const DEFAULT_LABELS = [
  "Direction A",
  "Direction B",
  "Direction C",
  "Direction D",
];

export function DirectionOrganizer({
  deliverables,
  requestId,
  votingMode,
  onUpdate,
  entityTable = "deliverables",
  heading = "Present as Directions",
}: DirectionOrganizerProps) {
  const router = useRouter();
  const [isDirectionsMode, setIsDirectionsMode] = useState(
    votingMode === "single" || votingMode === "team"
  );
  const [saving, setSaving] = useState(false);
  const [directions, setDirections] = useState<DirectionDeliverable[]>(() =>
    [...deliverables].sort(
      (a, b) => (a.direction_order ?? 999) - (b.direction_order ?? 999)
    )
  );

  const hasDirectionLabels = directions.some((d) => d.direction_label);

  const handleToggleDirections = useCallback(
    async (enabled: boolean) => {
      setIsDirectionsMode(enabled);
      const supabase = createClient();

      if (enabled) {
        // Auto-assign labels + order
        const updates = directions.map((d, i) => ({
          ...d,
          direction_label: d.direction_label || DEFAULT_LABELS[i] || `Direction ${String.fromCharCode(65 + i)}`,
          direction_order: i,
          direction_description: d.direction_description || null,
        }));
        setDirections(updates);

        // Save to DB
        setSaving(true);
        for (const d of updates) {
          await supabase
            .from(entityTable)
            .update({
              direction_label: d.direction_label,
              direction_order: d.direction_order,
              direction_description: d.direction_description,
            })
            .eq("id", d.id);
        }
        await supabase
          .from("requests")
          .update({ voting_mode: "single" })
          .eq("id", requestId);
        setSaving(false);
        toast.success("Directions mode enabled");
      } else {
        // Clear direction data
        setSaving(true);
        for (const d of directions) {
          await supabase
            .from(entityTable)
            .update({
              direction_label: null,
              direction_description: null,
              direction_order: null,
              is_recommended: false,
            })
            .eq("id", d.id);
        }
        await supabase
          .from("requests")
          .update({ voting_mode: null })
          .eq("id", requestId);
        setSaving(false);
        toast.success("Directions mode disabled");
      }
      onUpdate();
      router.refresh();
    },
    [directions, requestId, onUpdate, router]
  );

  const handleUpdateLabel = useCallback(
    async (id: string, label: string) => {
      setDirections((prev) =>
        prev.map((d) => (d.id === id ? { ...d, direction_label: label } : d))
      );
      const supabase = createClient();
      await supabase
        .from(entityTable)
        .update({ direction_label: label })
        .eq("id", id);
    },
    [entityTable]
  );

  const handleUpdateDescription = useCallback(
    async (id: string, description: string) => {
      setDirections((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, direction_description: description } : d
        )
      );
      const supabase = createClient();
      await supabase
        .from(entityTable)
        .update({ direction_description: description || null })
        .eq("id", id);
    },
    [entityTable]
  );

  const handleToggleRecommended = useCallback(
    async (id: string) => {
      const current = directions.find((d) => d.id === id);
      if (!current) return;

      // Only one can be recommended — clear others
      const updated = directions.map((d) => ({
        ...d,
        is_recommended: d.id === id ? !current.is_recommended : false,
      }));
      setDirections(updated);

      const supabase = createClient();
      for (const d of updated) {
        await supabase
          .from(entityTable)
          .update({ is_recommended: d.is_recommended })
          .eq("id", d.id);
      }
    },
    [directions, entityTable]
  );

  const handleMoveDirection = useCallback(
    async (index: number, delta: -1 | 1) => {
      const newIndex = index + delta;
      if (newIndex < 0 || newIndex >= directions.length) return;

      const updated = [...directions];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      const reordered = updated.map((d, i) => ({ ...d, direction_order: i }));
      setDirections(reordered);

      const supabase = createClient();
      for (const d of reordered) {
        await supabase
          .from(entityTable)
          .update({ direction_order: d.direction_order })
          .eq("id", d.id);
      }
    },
    [directions, entityTable]
  );

  if (deliverables.length < 2) return null;

  return (
    <div className="space-y-3">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PenToolIcon size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium">{heading}</span>
          {directions.length > 4 && isDirectionsMode && (
            <span className="text-xs text-amber-600">
              Tip: 2-3 options work best
            </span>
          )}
        </div>
        <Switch
          checked={isDirectionsMode}
          onCheckedChange={handleToggleDirections}
          disabled={saving}
        />
      </div>

      {/* Direction cards */}
      {isDirectionsMode && (
        <div className="space-y-2">
          {directions.map((d, i) => {
            const isImage = d.mime_type?.startsWith("image/");
            return (
              <Card
                key={d.id}
                className={`transition-all ${
                  d.is_recommended
                    ? "ring-2 ring-[#909af7] shadow-sm"
                    : ""
                }`}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    {isImage && d.url ? (
                      <div className="w-16 h-12 rounded-md overflow-hidden bg-muted shrink-0">
                        <img
                          src={d.url}
                          alt={d.direction_label || d.file_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-12 rounded-md bg-muted shrink-0 flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">
                          {d.file_name.split(".").pop()?.toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Label + Description */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <Input
                        value={d.direction_label || ""}
                        onChange={(e) =>
                          handleUpdateLabel(d.id, e.target.value)
                        }
                        onBlur={(e) =>
                          handleUpdateLabel(d.id, e.target.value)
                        }
                        placeholder={DEFAULT_LABELS[i] || "Direction name"}
                        maxLength={40}
                        className="h-7 text-sm font-medium border-none bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                      <Input
                        value={d.direction_description || ""}
                        onChange={(e) =>
                          handleUpdateDescription(d.id, e.target.value)
                        }
                        onBlur={(e) =>
                          handleUpdateDescription(d.id, e.target.value)
                        }
                        placeholder="Describe the vibe..."
                        maxLength={120}
                        className="h-6 text-xs text-muted-foreground border-none bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Reorder */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={i === 0}
                        onClick={() => handleMoveDirection(i, -1)}
                      >
                        <ArrowLeft01Icon size={14} className="rotate-90" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={i === directions.length - 1}
                        onClick={() => handleMoveDirection(i, 1)}
                      >
                        <ArrowRight01Icon size={14} className="rotate-90" />
                      </Button>

                      {/* Designer's Pick */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-7 w-7 ${
                          d.is_recommended
                            ? "text-[#909af7]"
                            : "text-muted-foreground"
                        }`}
                        onClick={() => handleToggleRecommended(d.id)}
                        title="Designer's Pick"
                      >
                        <CheckmarkCircle01Icon size={14} />
                      </Button>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1 mt-1.5 ml-[76px]">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {i + 1} of {directions.length}
                    </Badge>
                    {d.is_recommended && (
                      <Badge className="text-[10px] px-1.5 py-0 bg-[#909af7]">
                        Designer&apos;s Pick
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Hint */}
          {directions.length >= 2 && directions.length <= 3 && (
            <p className="text-[11px] text-muted-foreground text-center">
              Clients decide fastest with 2-3 options. Place your recommendation first or last.
            </p>
          )}
          {directions.length >= 4 && (
            <p className="text-[11px] text-amber-600 text-center">
              Consider grouping into fewer directions for a faster client decision.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
