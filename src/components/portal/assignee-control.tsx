"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckmarkCircle01Icon } from "@/components/ui/icons";

// The admin roster is fetched per page (profiles where role = admin, 2–3 rows)
// and joined in JS — never a PostgREST embed on requests.
export interface Admin {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const sizeClasses: Record<"sm" | "md", string> = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
};

/**
 * Avatar for a request's assignee. Resolves the id against the roster:
 * - resolved admin → initials/photo + tooltip
 * - unassigned (no id) → grey dashed "+" circle
 * - id set but not in roster (demoted/deleted admin) → dashed "–" + tooltip
 */
export function AssigneeAvatar({
  assigneeId,
  admins,
  size = "sm",
  tooltip = true,
}: {
  assigneeId: string | null | undefined;
  admins: Admin[];
  size?: "sm" | "md";
  tooltip?: boolean;
}) {
  const admin = assigneeId
    ? admins.find((a) => a.id === assigneeId) ?? null
    : null;
  const cls = sizeClasses[size];

  if (!admin) {
    const isDemoted = !!assigneeId;
    const dot = (
      <span
        className={`inline-flex items-center justify-center rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground/60 leading-none ${cls}`}
        aria-label={isDemoted ? "Former team member" : "Unassigned"}
      >
        {isDemoted ? "–" : "+"}
      </span>
    );
    if (!isDemoted || !tooltip) return dot;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{dot}</TooltipTrigger>
          <TooltipContent>
            No longer on the team — reassign this request.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const avatar = (
    <Avatar className={cls}>
      {admin.avatar_url && (
        <AvatarImage src={admin.avatar_url} alt={admin.full_name ?? ""} />
      )}
      <AvatarFallback className="bg-primary/15 text-primary font-medium">
        {initials(admin.full_name)}
      </AvatarFallback>
    </Avatar>
  );

  if (!tooltip) return avatar;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{avatar}</TooltipTrigger>
        <TooltipContent>{admin.full_name ?? "Assigned"}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Interactive assignee picker. Optimistic update + toast + refresh, mirroring
 * admin-board's handleArchive. Reverts on error. Safe inside draggable cards
 * and clickable rows (stops propagation on the trigger and menu).
 */
export function AssigneeMenu({
  requestId,
  assigneeId: initialAssigneeId,
  admins,
  size = "sm",
  showName = false,
}: {
  requestId: string;
  assigneeId: string | null | undefined;
  admins: Admin[];
  size?: "sm" | "md";
  showName?: boolean;
}) {
  const router = useRouter();
  const [assigneeId, setAssigneeId] = useState<string | null>(
    initialAssigneeId ?? null
  );
  const [saving, setSaving] = useState(false);

  // Keep in sync when a parent (or realtime refresh) passes a new value.
  useEffect(() => {
    setAssigneeId(initialAssigneeId ?? null);
  }, [initialAssigneeId]);

  const reassign = useCallback(
    async (nextId: string | null) => {
      if (nextId === assigneeId) return;
      const prev = assigneeId;
      setAssigneeId(nextId);
      setSaving(true);
      const supabase = createClient();
      const { error } = await supabase
        .from("requests")
        .update({ assignee_id: nextId })
        .eq("id", requestId);
      setSaving(false);
      if (error) {
        setAssigneeId(prev);
        toast.error("Couldn't update assignee. Try again.");
        return;
      }
      const name = nextId
        ? admins.find((a) => a.id === nextId)?.full_name ?? "someone"
        : null;
      toast.success(name ? `Assigned to ${name}` : "Unassigned");
      router.refresh();
    },
    [assigneeId, admins, requestId, router]
  );

  const current = assigneeId
    ? admins.find((a) => a.id === assigneeId) ?? null
    : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60"
          title="Assign"
        >
          <AssigneeAvatar assigneeId={assigneeId} admins={admins} size={size} tooltip={false} />
          {showName && (
            <span className="text-xs text-muted-foreground">
              {current?.full_name ??
                (assigneeId ? "Former member" : "Unassigned")}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel>Assign to</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {admins.map((a) => (
          <DropdownMenuItem
            key={a.id}
            onClick={() => reassign(a.id)}
            className="gap-2"
          >
            <AssigneeAvatar
              assigneeId={a.id}
              admins={admins}
              size="sm"
              tooltip={false}
            />
            <span className="flex-1 truncate">{a.full_name ?? "Admin"}</span>
            {assigneeId === a.id && (
              <CheckmarkCircle01Icon size={14} className="text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => reassign(null)}
          className="gap-2 text-muted-foreground"
        >
          <AssigneeAvatar
            assigneeId={null}
            admins={admins}
            size="sm"
            tooltip={false}
          />
          <span className="flex-1">Unassigned</span>
          {!assigneeId && (
            <CheckmarkCircle01Icon size={14} className="text-primary" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
