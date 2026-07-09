"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PlusSignIcon, Cancel01Icon } from "@/components/ui/icons";
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
import { assignAsClient, applyInvite } from "@/lib/portal/invites";
import { toast } from "sonner";
import Image from "next/image";
import { TeamRolesSection, type Profile } from "@/components/portal/team-roles-section";

interface Invite {
  email: string;
  client_id: string | null;
  role: string;
  created_at: string;
  clients: { name: string } | null;
}

interface Client {
  id: string;
  name: string;
  slug: string;
}

interface AdminSettingsViewProps {
  invites: Invite[];
  clients: Client[];
  profiles: Profile[];
  currentUserId: string;
  isOwner?: boolean;
}

export function AdminSettingsView({
  invites,
  clients,
  profiles,
  currentUserId,
  isOwner = true,
}: AdminSettingsViewProps) {
  const router = useRouter();
  const [inviteMode, setInviteMode] = useState<"client" | "staff">("client");
  const [email, setEmail] = useState("");
  const [clientId, setClientId] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState<{
    kind: "admin" | "member" | "other";
    profile: Profile;
  } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [inviteToResolve, setInviteToResolve] = useState<Invite | null>(null);
  const [isResolvingInvite, setIsResolvingInvite] = useState(false);

  const selectedClientName =
    clients.find((c) => c.id === clientId)?.name ?? "this project";

  // Which pending-invite emails already have an account (invite will never
  // apply on sign-in — needs manual resolution).
  const profileByEmail = useMemo(() => {
    const map = new Map<string, Profile>();
    for (const p of profiles) {
      if (p.email) map.set(p.email.toLowerCase(), p);
    }
    return map;
  }, [profiles]);

  const handleResolveInvite = async () => {
    if (!inviteToResolve || !inviteToResolve.client_id) return;
    const existing = profileByEmail.get(inviteToResolve.email.toLowerCase());
    if (!existing) return;
    setIsResolvingInvite(true);
    const supabase = createClient();
    const result = await applyInvite(supabase, {
      profileId: existing.id,
      email: inviteToResolve.email,
      clientId: inviteToResolve.client_id,
    });
    setIsResolvingInvite(false);
    if (result.error) {
      toast.error(
        result.partial
          ? `Role updated but couldn't clear the invite: ${result.error}`
          : result.error
      );
      if (result.partial) {
        setInviteToResolve(null);
        router.refresh();
      }
      return;
    }
    toast.success(
      `${existing.full_name || existing.email} is now a Client of ${inviteToResolve.clients?.name ?? "their project"}`
    );
    setInviteToResolve(null);
    router.refresh();
  };

  const resetConflict = () => {
    if (conflict) setConflict(null);
    if (error) setError("");
  };

  const handleInvite = async () => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return;
    if (inviteMode === "client" && !clientId) return;

    const existing = profiles.find(
      (p) => p.email?.toLowerCase() === normalized
    );

    // Staff invite: a studio-wide member (role='admin', is_owner=false) with no
    // client. Insert with client_id=null; claim_invite/handle_new_user set the
    // role on first sign-in (see 20260719_staff_invites.sql).
    if (inviteMode === "staff") {
      if (existing) {
        setError(
          "This person already has an account — set their role in Team & Roles below."
        );
        return;
      }
      setIsInviting(true);
      setError("");
      const supabase = createClient();
      const { error: insertError } = await supabase
        .from("invited_emails")
        .insert({ email: normalized, client_id: null, role: "admin" });
      if (insertError) {
        setError(
          insertError.code === "23505"
            ? "This email is already invited."
            : "Failed to send invite."
        );
        setIsInviting(false);
        return;
      }
      fetch("/api/portal/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "invite",
          invite_email: normalized,
          client_name: "Vimi Studio",
          staff: true,
        }),
      }).catch(() => {});
      setEmail("");
      setIsInviting(false);
      router.refresh();
      return;
    }

    // Client invite. Only ever create an invite row for an email that will
    // genuinely consume it on first sign-in. If a profile already exists,
    // branch instead.
    if (existing) {
      if (existing.role === "admin") {
        setConflict({ kind: "admin", profile: existing });
      } else if (existing.client_id === clientId) {
        setConflict({ kind: "member", profile: existing });
      } else {
        setConflict({ kind: "other", profile: existing });
      }
      return;
    }

    setIsInviting(true);
    setError("");

    const supabase = createClient();
    const { error: insertError } = await supabase
      .from("invited_emails")
      .insert({
        email: email.trim().toLowerCase(),
        client_id: clientId,
        role: "client",
      });

    if (insertError) {
      setError(
        insertError.code === "23505"
          ? "This email is already invited."
          : "Failed to send invite."
      );
      setIsInviting(false);
      return;
    }

    // Send invite email (fire-and-forget)
    const clientName = clients.find((c) => c.id === clientId)?.name || "your project";
    fetch("/api/portal/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "invite",
        invite_email: email.trim().toLowerCase(),
        client_name: clientName,
      }),
    }).catch(() => {});

    setEmail("");
    setClientId("");
    setIsInviting(false);
    router.refresh();
  };

  const handleResolveConflict = async () => {
    if (!conflict) return;
    setIsResolving(true);
    const supabase = createClient();
    const result = await assignAsClient(supabase, {
      profileId: conflict.profile.id,
      clientId,
    });
    setIsResolving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    const who =
      conflict.profile.full_name || conflict.profile.email || "They";
    toast.success(
      conflict.kind === "admin"
        ? `${who} is now a Client of ${selectedClientName}`
        : `${who} moved to ${selectedClientName}`
    );
    setConfirmOpen(false);
    setConflict(null);
    setEmail("");
    setClientId("");
    router.refresh();
  };

  const handleRevokeInvite = async (inviteEmail: string) => {
    const supabase = createClient();
    await supabase
      .from("invited_emails")
      .delete()
      .eq("email", inviteEmail);
    router.refresh();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {/* Invite Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Invite someone</h2>
          <p className="text-sm text-muted-foreground">
            {inviteMode === "client"
              ? "Pre-approve an email so they can sign in with Google and automatically join their project."
              : "Give a studio member access to every client board. No revenue, no settings — that stays owner-only."}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Client vs Staff */}
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-[color:var(--muted)] p-1">
              {(["client", "staff"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setInviteMode(m);
                    resetConflict();
                  }}
                  className={`rounded-md py-1.5 text-sm font-medium transition-colors ${
                    inviteMode === m
                      ? "bg-white text-[color:var(--vimi-ink)] shadow-sm"
                      : "text-[color:var(--vimi-muted)] hover:text-[color:var(--vimi-ink)]"
                  }`}
                >
                  {m === "client" ? "Client" : "Staff member"}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium tracking-wider text-muted-foreground">
                EMAIL
              </Label>
              <Input
                type="email"
                placeholder="client@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  resetConflict();
                }}
              />
            </div>

            {inviteMode === "client" && (
              <div className="space-y-2">
                <Label className="text-xs font-medium tracking-wider text-muted-foreground">
                  PROJECT
                </Label>
                <Select
                  value={clientId}
                  onValueChange={(v) => {
                    setClientId(v);
                    resetConflict();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client project" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="bg-white border shadow-lg z-50">
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            {conflict && (
              <div className="rounded-lg border border-[#F3D9A6] bg-[#FFF8ED] px-3 py-3 space-y-2">
                {conflict.kind === "admin" && (
                  <>
                    <p className="text-sm text-[color:var(--status-review-ink)]">
                      This email is already an{" "}
                      <span className="font-medium">Admin</span> — an invite
                      can&apos;t apply to it.
                    </p>
                    <Button
                      onClick={() => setConfirmOpen(true)}
                      className="w-full bg-[var(--vimi-ink)] hover:bg-[var(--vimi-ink)]/90"
                    >
                      Convert to client of {selectedClientName}
                    </Button>
                  </>
                )}
                {conflict.kind === "member" && (
                  <p className="text-sm text-[color:var(--status-review-ink)]">
                    Already a member of{" "}
                    <span className="font-medium">{selectedClientName}</span>.
                    Nothing to do.
                  </p>
                )}
                {conflict.kind === "other" && (
                  <>
                    <p className="text-sm text-[color:var(--status-review-ink)]">
                      <span className="font-medium">
                        {conflict.profile.email}
                      </span>{" "}
                      currently belongs to{" "}
                      <span className="font-medium">
                        {clients.find(
                          (c) => c.id === conflict.profile.client_id
                        )?.name ??
                          conflict.profile.clients?.name ??
                          "another client"}
                      </span>
                      .
                    </p>
                    <Button
                      onClick={() => setConfirmOpen(true)}
                      className="w-full bg-[var(--vimi-ink)] hover:bg-[var(--vimi-ink)]/90"
                    >
                      Move to {selectedClientName}
                    </Button>
                  </>
                )}
              </div>
            )}

            <Button
              onClick={handleInvite}
              disabled={
                !email.trim() ||
                (inviteMode === "client" && !clientId) ||
                isInviting
              }
              className="w-full gap-2 bg-primary hover:bg-primary/90"
            >
              <PlusSignIcon size={16} />
              {isInviting ? "Inviting..." : "Send Invite"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Pending Invites */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Pending Invites</h2>

        {invites.length > 0 ? (
          <div className="space-y-2">
            {invites.map((invite) => {
              const conflictProfile = profileByEmail.get(
                invite.email.toLowerCase()
              );
              return (
                <Card key={invite.email}>
                  <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {invite.email}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {invite.clients?.name ?? "Unknown"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Invited{" "}
                          {new Date(invite.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {conflictProfile ? (
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] text-[color:var(--status-review-ink)]">
                            {invite.email} already has{" "}
                            {conflictProfile.role === "admin"
                              ? "an Admin"
                              : "a Client"}{" "}
                            account — this invite will never apply
                          </span>
                          <button
                            onClick={() => setInviteToResolve(invite)}
                            className="inline-flex items-center rounded-full bg-[#FFF3DE] text-[color:var(--status-review-ink)] text-[11px] px-2.5 py-1 hover:bg-[#FFE9C7] transition-colors"
                          >
                            Resolve
                          </button>
                        </div>
                      ) : (
                        <p className="mt-1.5 text-[11px] text-muted-foreground">
                          Awaiting first sign-in
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRevokeInvite(invite.email)}
                      className="text-muted-foreground hover:text-red-500 transition-colors p-1 shrink-0"
                    >
                      <Cancel01Icon size={16} />
                    </button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No pending invites. Invites are consumed when the client signs in.
          </p>
        )}
      </div>

      {/* Team & Roles */}
      <TeamRolesSection
        profiles={profiles}
        clients={clients}
        invites={invites}
        currentUserId={currentUserId}
        isOwner={isOwner}
      />

      {/* Resolve stale invite confirmation */}
      <AlertDialog
        open={!!inviteToResolve}
        onOpenChange={(open) => !open && setInviteToResolve(null)}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Apply invite to {inviteToResolve?.email}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This makes them a{" "}
              <span className="font-medium">client</span> of{" "}
              <span className="font-medium">
                {inviteToResolve?.clients?.name ?? "their project"}
              </span>{" "}
              and clears this pending invite. If they were an Admin, they&apos;ll
              lose studio-wide access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResolvingInvite}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleResolveInvite();
              }}
              disabled={isResolvingInvite}
              className="bg-[var(--vimi-ink)] hover:bg-[var(--vimi-ink)]/90 text-white"
            >
              {isResolvingInvite ? "Applying..." : "Apply invite"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Studio Info */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Studio</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Image
                src="/vimi-logo-dark.svg"
                alt="Vimi Studio"
                width={120}
                height={39}
                className="h-7 w-auto"
              />
              <p className="text-xs text-muted-foreground">
                vimistudio.com
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Convert / move confirmation */}
      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => !open && setConfirmOpen(false)}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {conflict?.kind === "admin"
                ? `Convert ${conflict.profile.full_name || conflict.profile.email} to a client?`
                : `Move ${conflict?.profile.full_name || conflict?.profile.email} to ${selectedClientName}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {conflict?.kind === "admin" ? (
                <>
                  They&apos;ll <span className="font-medium">lose Admin access</span>{" "}
                  — no more visibility into all clients, revenue, or settings —
                  and become a client of{" "}
                  <span className="font-medium">{selectedClientName}</span>.
                </>
              ) : (
                <>
                  They&apos;ll lose access to their current client and only see{" "}
                  <span className="font-medium">{selectedClientName}</span> going
                  forward. Their requests and comments stay intact.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResolving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleResolveConflict();
              }}
              disabled={isResolving}
              className="bg-[var(--vimi-ink)] hover:bg-[var(--vimi-ink)]/90 text-white"
            >
              {isResolving
                ? "Working..."
                : conflict?.kind === "admin"
                  ? "Convert to client"
                  : "Move client"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
