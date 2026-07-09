"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontalIcon, CheckmarkCircle01Icon } from "@/components/ui/icons";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { applyInvite } from "@/lib/portal/invites";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  slug: string;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  client_id: string | null;
  role: string;
  /** Owner = admin + is_owner; Staff = admin without. Absent pre-migration. */
  is_owner?: boolean | null;
  /** Free-text job title, e.g. "Fotógrafo". */
  title?: string | null;
  first_login_at: string | null;
  created_at: string;
  clients: { id: string; name: string } | null;
}

interface PendingInvite {
  email: string;
  client_id: string | null;
  role: string;
  clients: { name: string } | null;
}

interface TeamRolesSectionProps {
  profiles: Profile[];
  clients: Client[];
  invites: PendingInvite[];
  currentUserId: string;
  /** Only owners can manage people; the row menu hides for everyone else. */
  isOwner?: boolean;
}

type Tier = "owner" | "staff" | "client";
type ActionKind = "makeOwner" | "makeStaff" | "makeClient";

const displayName = (p: Profile) => p.full_name || p.email || "Unknown user";

// Fail OPEN: only an explicit is_owner=false demotes an admin to Staff, so the
// sole owner never shows as Staff during the pre-migration deploy window.
const tierOf = (p: Profile): Tier =>
  p.role === "admin" ? (p.is_owner === false ? "staff" : "owner") : "client";

const tierBadge: Record<Tier, { label: string; className: string }> = {
  owner: {
    label: "Owner",
    className:
      "text-[10px] px-1.5 py-0 bg-[var(--vimi-ink)] text-white hover:bg-[var(--vimi-ink)]",
  },
  staff: {
    label: "Staff",
    className:
      "text-[10px] px-1.5 py-0 border border-[color:var(--vimi-border)] bg-transparent text-[color:var(--vimi-ink)]",
  },
  client: {
    label: "Client",
    className:
      "text-[10px] px-1.5 py-0 bg-[color:var(--muted)] text-[color:var(--vimi-muted)] hover:bg-[color:var(--muted)]",
  },
};

export function TeamRolesSection({
  profiles,
  clients,
  invites,
  currentUserId,
  isOwner = true,
}: TeamRolesSectionProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<{
    profile: Profile;
    action: ActionKind;
  } | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<Profile | null>(null);
  const [titleTarget, setTitleTarget] = useState<Profile | null>(null);
  const [titleValue, setTitleValue] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Count OWNERS (not admins) so we never strip the last owner.
  const ownerCount = useMemo(
    () => profiles.filter((p) => tierOf(p) === "owner").length,
    [profiles]
  );

  // Map lowercased email -> pending invite, to surface stale-invite hints.
  const inviteByEmail = useMemo(() => {
    const map = new Map<string, PendingInvite>();
    for (const inv of invites) map.set(inv.email.toLowerCase(), inv);
    return map;
  }, [invites]);

  const handleApplyInvite = async (
    profile: Profile,
    invite: PendingInvite
  ) => {
    if (!invite.client_id) return; // client invites only (staff have no project)
    setBusyId(profile.id);
    const supabase = createClient();
    const result = await applyInvite(supabase, {
      profileId: profile.id,
      email: invite.email,
      clientId: invite.client_id,
    });
    setBusyId(null);
    if (result.error) {
      toast.error(
        result.partial
          ? `Role updated but couldn't clear the invite: ${result.error}`
          : result.error
      );
      if (result.partial) router.refresh();
      return;
    }
    toast.success(
      `${displayName(profile)} is now a Client of ${invite.clients?.name ?? "their project"}`
    );
    router.refresh();
  };

  const applyAction = async (profile: Profile, action: ActionKind) => {
    setBusyId(profile.id);
    const supabase = createClient();
    // Owner/Staff both keep role='admin' so every is_admin() RLS check still
    // passes; only is_owner + client link change.
    const patch =
      action === "makeOwner"
        ? { role: "admin" as const, is_owner: true, client_id: null }
        : action === "makeStaff"
          ? { role: "admin" as const, is_owner: false, client_id: null }
          : { role: "client" as const, is_owner: false };
    const { error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", profile.id);
    setBusyId(null);
    setPendingAction(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    const label =
      action === "makeOwner"
        ? "an Owner"
        : action === "makeStaff"
          ? "Staff"
          : "a Client";
    toast.success(`${displayName(profile)} is now ${label}`);
    router.refresh();
  };

  const saveTitle = async () => {
    if (!titleTarget) return;
    const trimmed = titleValue.trim();
    setBusyId(titleTarget.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ title: trimmed || null })
      .eq("id", titleTarget.id);
    setBusyId(null);
    setTitleTarget(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      trimmed
        ? `Title set to "${trimmed}"`
        : `Title cleared for ${displayName(titleTarget)}`
    );
    router.refresh();
  };

  const assignClient = async (profile: Profile, client: Client | null) => {
    setBusyId(profile.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ client_id: client?.id ?? null })
      .eq("id", profile.id);
    setBusyId(null);
    setMemberToRemove(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      client
        ? `${displayName(profile)} assigned to ${client.name}`
        : `${displayName(profile)} removed from their client`
    );
    router.refresh();
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        <div>
          <h2 className="font-serif italic text-xl text-[color:var(--vimi-ink)]">
            Team &amp; Roles
          </h2>
          <p className="text-sm text-[color:var(--vimi-muted)]">
            Everyone with a portal account. Change roles, reassign clients, or
            remove access.
          </p>
        </div>

        {profiles.length > 0 ? (
          <div className="space-y-2">
            {profiles.map((profile) => {
              const isSelf = profile.id === currentUserId;
              const tier = tierOf(profile);
              const isLastOwner = tier === "owner" && ownerCount <= 1;
              const pendingInvite = profile.email
                ? inviteByEmail.get(profile.email.toLowerCase())
                : undefined;
              const showStaleHint =
                profile.role === "admin" &&
                !!pendingInvite &&
                !!pendingInvite.client_id;
              const busy = busyId === profile.id;

              // Removing owner status (de-own or demote to client) is blocked
              // for yourself and for the last remaining owner.
              const ownerLocked = tier === "owner" && (isSelf || isLastOwner);
              const ownerLockReason = isSelf
                ? "You can't change your own role"
                : "Can't remove the last owner";

              const badge = tierBadge[tier];

              return (
                <Card key={profile.id}>
                  <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {profile.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profile.avatar_url}
                          alt={displayName(profile)}
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[var(--accent)] text-[color:var(--accent-foreground)] flex items-center justify-center text-xs font-semibold shrink-0">
                          {displayName(profile).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate text-[color:var(--vimi-ink)]">
                            {displayName(profile)}
                          </p>
                          <Badge className={badge.className}>
                            {badge.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-[color:var(--vimi-muted)] truncate">
                            {profile.email}
                          </span>
                          <span className="text-xs text-[color:var(--vimi-faint)]">
                            &middot;
                          </span>
                          <span className="text-xs text-[color:var(--vimi-faint)] truncate">
                            {profile.title
                              ? profile.title
                              : profile.role === "admin"
                                ? "Studio-wide"
                                : profile.clients?.name ?? "—"}
                          </span>
                        </div>
                        {showStaleHint && (
                          <button
                            onClick={() =>
                              handleApplyInvite(profile, pendingInvite!)
                            }
                            disabled={busy}
                            className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-[#FFF3DE] text-[color:var(--status-review-ink)] text-[11px] px-2.5 py-1 hover:bg-[#FFE9C7] transition-colors disabled:opacity-50"
                          >
                            <CheckmarkCircle01Icon size={13} />
                            Has a pending client invite — Apply invite
                          </button>
                        )}
                      </div>
                    </div>

                    {isOwner && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="text-[color:var(--vimi-faint)] hover:text-[color:var(--vimi-ink)] transition-colors p-2 shrink-0 rounded-full"
                            aria-label="Manage member"
                            disabled={busy}
                          >
                            <MoreHorizontalIcon size={18} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white w-56">
                          <DropdownMenuLabel className="text-xs text-[color:var(--vimi-muted)] font-normal truncate">
                            {displayName(profile)}
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          {/* Promote to Owner — available to Staff and Clients */}
                          {tier !== "owner" && (
                            <DropdownMenuItem
                              onSelect={() =>
                                setPendingAction({ profile, action: "makeOwner" })
                              }
                            >
                              Make Owner
                            </DropdownMenuItem>
                          )}

                          {/* Make Staff — promote a Client, or de-own an Owner */}
                          {tier === "client" && (
                            <DropdownMenuItem
                              onSelect={() =>
                                setPendingAction({ profile, action: "makeStaff" })
                              }
                            >
                              Make Staff
                            </DropdownMenuItem>
                          )}
                          {tier === "owner" &&
                            (ownerLocked ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <DropdownMenuItem disabled>
                                      Make Staff
                                    </DropdownMenuItem>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>{ownerLockReason}</TooltipContent>
                              </Tooltip>
                            ) : (
                              <DropdownMenuItem
                                onSelect={() =>
                                  setPendingAction({
                                    profile,
                                    action: "makeStaff",
                                  })
                                }
                              >
                                Make Staff
                              </DropdownMenuItem>
                            ))}

                          {/* Demote an admin (Owner/Staff) to Client */}
                          {profile.role === "admin" &&
                            (tier === "owner" && ownerLocked ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <DropdownMenuItem disabled>
                                      Change to Client
                                    </DropdownMenuItem>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>{ownerLockReason}</TooltipContent>
                              </Tooltip>
                            ) : (
                              <DropdownMenuItem
                                onSelect={() =>
                                  setPendingAction({
                                    profile,
                                    action: "makeClient",
                                  })
                                }
                              >
                                Change to Client
                              </DropdownMenuItem>
                            ))}

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => {
                              setTitleValue(profile.title ?? "");
                              setTitleTarget(profile);
                            }}
                          >
                            Set title…
                          </DropdownMenuItem>

                          {profile.role !== "admin" && (
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                {profile.client_id
                                  ? "Reassign client"
                                  : "Assign client"}
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent className="bg-white max-h-64 overflow-y-auto">
                                {clients.map((c) => (
                                  <DropdownMenuItem
                                    key={c.id}
                                    disabled={c.id === profile.client_id}
                                    onSelect={() => assignClient(profile, c)}
                                  >
                                    {c.name}
                                    {c.id === profile.client_id && (
                                      <span className="ml-auto text-[color:var(--vimi-faint)]">
                                        Current
                                      </span>
                                    )}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          )}

                          {profile.role !== "admin" && profile.client_id && (
                            <>
                              <DropdownMenuSeparator />
                              {isSelf ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <DropdownMenuItem
                                        disabled
                                        className="text-red-500"
                                      >
                                        Remove access
                                      </DropdownMenuItem>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    You can&apos;t remove your own access
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <DropdownMenuItem
                                  className="text-red-500 focus:text-red-500"
                                  onSelect={() => setMemberToRemove(profile)}
                                >
                                  Remove access
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[color:var(--vimi-muted)]">
            No one has signed in yet.
          </p>
        )}
      </div>

      {/* Role / ownership change confirmation */}
      <AlertDialog
        open={!!pendingAction}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <AlertDialogContent className="bg-white">
          {pendingAction && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {pendingAction.action === "makeOwner"
                    ? `Make ${displayName(pendingAction.profile)} an Owner?`
                    : pendingAction.action === "makeStaff"
                      ? `Make ${displayName(pendingAction.profile)} Staff?`
                      : `Make ${displayName(pendingAction.profile)} a Client?`}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {pendingAction.action === "makeOwner" ? (
                    <>
                      Owners have <span className="font-medium">full studio access</span> —
                      including <span className="font-medium">revenue</span> and the ability
                      to add, remove, or change anyone&apos;s role. Grant this only
                      to a co-owner you trust with the whole business.
                    </>
                  ) : pendingAction.action === "makeStaff" ? (
                    <>
                      They become a studio member with operational access to{" "}
                      <span className="font-medium">every client&apos;s board</span> — but
                      no revenue and no people management.
                      {tierOf(pendingAction.profile) === "client" && (
                        <> They&apos;ll be unlinked from their current client.</>
                      )}
                    </>
                  ) : (
                    <>
                      They&apos;ll lose studio-wide access — no more visibility into
                      other clients, revenue, or settings. Assign them to a client
                      afterward so they can use the portal.
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={busyId === pendingAction.profile.id}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    applyAction(pendingAction.profile, pendingAction.action);
                  }}
                  disabled={busyId === pendingAction.profile.id}
                  className="bg-[var(--vimi-ink)] hover:bg-[var(--vimi-ink)]/90 text-white"
                >
                  {busyId === pendingAction.profile.id
                    ? "Updating..."
                    : pendingAction.action === "makeOwner"
                      ? "Make Owner"
                      : pendingAction.action === "makeStaff"
                        ? "Make Staff"
                        : "Make Client"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* Set title dialog */}
      <Dialog
        open={!!titleTarget}
        onOpenChange={(open) => !open && setTitleTarget(null)}
      >
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>
              Set title{titleTarget ? ` — ${displayName(titleTarget)}` : ""}
            </DialogTitle>
            <DialogDescription>
              A short job title shown next to their name, e.g.{" "}
              <span className="font-medium">Fotógrafo</span>. Leave blank to clear.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="member-title" className="text-xs font-medium tracking-wider text-muted-foreground">
              TITLE
            </Label>
            <Input
              id="member-title"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              placeholder="Fotógrafo"
              maxLength={60}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  saveTitle();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setTitleTarget(null)}
              disabled={busyId === titleTarget?.id}
            >
              Cancel
            </Button>
            <Button
              onClick={saveTitle}
              disabled={busyId === titleTarget?.id}
              className="bg-[var(--vimi-ink)] hover:bg-[var(--vimi-ink)]/90 text-white"
            >
              {busyId === titleTarget?.id ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove access confirmation */}
      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {memberToRemove && displayName(memberToRemove)}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              They&apos;ll lose access to{" "}
              <span className="font-medium">
                {memberToRemove?.clients?.name ?? "this client"}
              </span>{" "}
              immediately. Their requests, comments, and uploads stay intact.
              You can reassign them later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busyId === memberToRemove?.id}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (memberToRemove) assignClient(memberToRemove, null);
              }}
              disabled={busyId === memberToRemove?.id}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {busyId === memberToRemove?.id ? "Removing..." : "Remove access"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
