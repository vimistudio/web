"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const REASON_LABELS: Record<string, string> = {
  billing: "Billing",
  client_on_hold: "Client on hold",
  scope_paused: "Scope paused",
  studio_on_hold: "Studio on hold",
  other: "Other",
};

interface PausedBannerProps {
  clientId: string;
  clientName: string;
  reason: string | null;
  note: string | null;
  pausedAt: string | null;
  pausedUntil: string | null;
  visibleToClient: boolean;
}

/**
 * Sticky banner shown to admins when viewing a paused client's board.
 * Recognition over Recall (reason + dates surfaced), Fitts (big Reactivate
 * button), Goal Gradient (reactivation feels one-click).
 */
export function PausedBanner({
  clientId,
  clientName,
  reason,
  note,
  pausedAt,
  pausedUntil,
  visibleToClient,
}: PausedBannerProps) {
  const router = useRouter();
  const [isReactivating, setIsReactivating] = useState(false);

  const reasonLabel = reason ? REASON_LABELS[reason] || reason : "Paused";
  const sinceLabel = pausedAt
    ? formatDistanceToNow(new Date(pausedAt), { addSuffix: false })
    : null;
  const resumeLabel = pausedUntil
    ? new Date(pausedUntil).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const handleReactivate = async () => {
    if (!confirm(`Reactivate ${clientName}? They'll get full portal access back immediately.`)) return;
    setIsReactivating(true);
    const res = await fetch(`/api/portal/admin/clients/${clientId}/pause`, {
      method: "DELETE",
    });
    setIsReactivating(false);
    if (!res.ok) {
      toast.error("Couldn't reactivate");
      return;
    }
    toast.success(`${clientName} reactivated`);
    router.refresh();
  };

  return (
    <div className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 mb-4 flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center shrink-0 mt-0.5">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 text-amber-700"
        >
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-amber-900">
            {clientName} is paused
          </span>
          <span className="text-[11px] text-amber-700/80">
            {reasonLabel}
            {sinceLabel ? ` · since ${sinceLabel} ago` : ""}
            {resumeLabel ? ` · resumes ${resumeLabel}` : " · no resume date"}
          </span>
        </div>
        {note && (
          <p className="text-[11px] text-amber-900/80 mt-1 italic">
            &ldquo;{note}&rdquo;
            {visibleToClient && (
              <span className="ml-2 not-italic text-amber-700/60">
                · client can see reason
              </span>
            )}
          </p>
        )}
      </div>
      <Button
        onClick={handleReactivate}
        disabled={isReactivating}
        className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
        size="sm"
      >
        {isReactivating ? "Reactivating..." : "Reactivate now"}
      </Button>
    </div>
  );
}
