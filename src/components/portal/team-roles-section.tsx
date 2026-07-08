"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  first_login_at: string | null;
  created_at: string;
  clients: { id: string; name: string } | null;
}

interface PendingInvite {
  email: string;
  client_id: string;
  role: string;
  clients: { name: string } | null;
}

interface TeamRolesSectionProps {
  profiles: Profile[];
  clients: Client[];
  invites: PendingInvite[];
  currentUserId: string;
}

const displayName = (p: Profile) => p.full_name || p.email || "Unknown user";

export function TeamRolesSection({
  profiles,
  clients,
  invites,
  currentUserId,
}: TeamRolesSectionProps) {
  const router = useRouter();
  const [pendingRoleChange, setPendingRoleChange] = useState<Profile | null>(
    null
  );
  const [memberToRemove, setMemberToRemove] = useState<Profile | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const adminCount = useMemo(
    () => profiles.filter((p) => p.role === "admin").length,
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

  const changeRole = async (profile: Profile, newRole: "admin" | "client") => {
    setBusyId(profile.id);
    const supabase = createClient();
    // Promoting to admin makes them studio-wide: clear their client link.
    const patch =
      newRole === "admin"
        ? { role: "admin" as const, client_id: null }
        : { role: "client" as const };
    const { error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", profile.id);
    setBusyId(null);
    setPendingRoleChange(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      `${displayName(profile)} is now ${newRole === "admin" ? "an Admin" : "a Client"}`
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
              const isAdmin = profile.role === "admin";
              const isLastAdmin = isAdmin && adminCount <= 1;
              const pendingInvite = profile.email
                ? inviteByEmail.get(profile.email.toLowerCase())
                : undefined;
              const showStaleHint = isAdmin && !!pendingInvite;
              const busy = busyId === profile.id;

              // Guards for demotion / de-access.
              const demoteDisabled = isSelf || isLastAdmin;
              const demoteReason = isSelf
                ? "You can't change your own role"
                : "Can't demote the last remaining admin";

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
                          <Badge
                            className={
                              isAdmin
                                ? "text-[10px] px-1.5 py-0 bg-[var(--vimi-ink)] text-white hover:bg-[var(--vimi-ink)]"
                                : "text-[10px] px-1.5 py-0 bg-[color:var(--muted)] text-[color:var(--vimi-muted)] hover:bg-[color:var(--muted)]"
                            }
                          >
                            {isAdmin ? "Admin" : "Client"}
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
                            {isAdmin
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
                      <DropdownMenuContent
                        align="end"
                        className="bg-white w-56"
                      >
                        <DropdownMenuLabel className="text-xs text-[color:var(--vimi-muted)] font-normal truncate">
                          {displayName(profile)}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {isAdmin ? (
                          demoteDisabled ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <DropdownMenuItem disabled>
                                    Change to Client
                                  </DropdownMenuItem>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>{demoteReason}</TooltipContent>
                            </Tooltip>
                          ) : (
                            <DropdownMenuItem
                              onSelect={() => setPendingRoleChange(profile)}
                            >
                              Change to Client
                            </DropdownMenuItem>
                          )
                        ) : (
                          <DropdownMenuItem
                            onSelect={() => setPendingRoleChange(profile)}
                          >
                            Make Admin
                          </DropdownMenuItem>
                        )}

                        {!isAdmin && (
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

                        {!isAdmin && profile.client_id && (
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

      {/* Role change confirmation */}
      <AlertDialog
        open={!!pendingRoleChange}
        onOpenChange={(open) => !open && setPendingRoleChange(null)}
      >
        <AlertDialogContent className="bg-white">
          {pendingRoleChange &&
            (pendingRoleChange.role === "admin" ? (
              <>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Make {displayName(pendingRoleChange)} a Client?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    They&apos;ll lose studio-wide access — no more visibility
                    into all clients, revenue, or settings. Assign them to a
                    client afterward so they can use the portal.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={busyId === pendingRoleChange.id}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      changeRole(pendingRoleChange, "client");
                    }}
                    disabled={busyId === pendingRoleChange.id}
                    className="bg-[var(--vimi-ink)] hover:bg-[var(--vimi-ink)]/90 text-white"
                  >
                    {busyId === pendingRoleChange.id
                      ? "Updating..."
                      : "Make Client"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </>
            ) : (
              <>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Make {displayName(pendingRoleChange)} an Admin?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Admins are studio-wide. This grants full access to{" "}
                    <span className="font-medium">all clients</span>, revenue,
                    and settings, and will{" "}
                    <span className="font-medium">
                      unlink them from their current client
                    </span>{" "}
                    ({pendingRoleChange.clients?.name ?? "none"}).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={busyId === pendingRoleChange.id}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      changeRole(pendingRoleChange, "admin");
                    }}
                    disabled={busyId === pendingRoleChange.id}
                    className="bg-[var(--vimi-ink)] hover:bg-[var(--vimi-ink)]/90 text-white"
                  >
                    {busyId === pendingRoleChange.id
                      ? "Updating..."
                      : "Make Admin"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </>
            ))}
        </AlertDialogContent>
      </AlertDialog>

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
