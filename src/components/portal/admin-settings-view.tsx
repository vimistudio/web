"use client";

import { useState } from "react";
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
import Image from "next/image";
import { toast } from "sonner";

interface Invite {
  email: string;
  client_id: string;
  role: string;
  created_at: string;
  clients: { name: string } | null;
}

interface Client {
  id: string;
  name: string;
  slug: string;
}

interface Member {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  client_id: string | null;
  first_login_at: string | null;
  created_at: string;
  clients: { id: string; name: string } | null;
}

interface AdminSettingsViewProps {
  invites: Invite[];
  clients: Client[];
  members: Member[];
}

export function AdminSettingsView({
  invites,
  clients,
  members,
}: AdminSettingsViewProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [clientId, setClientId] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState("");
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    setIsRemoving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ client_id: null })
      .eq("id", memberToRemove.id);
    setIsRemoving(false);
    if (updateError) {
      toast.error("Couldn't remove member");
      return;
    }
    toast.success(
      `${memberToRemove.full_name || memberToRemove.email} removed from ${memberToRemove.clients?.name ?? "client"}`
    );
    setMemberToRemove(null);
    router.refresh();
  };

  const handleInvite = async () => {
    if (!email.trim() || !clientId) return;
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

      {/* Invite Client Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Invite a Client</h2>
          <p className="text-sm text-muted-foreground">
            Pre-approve an email so they can sign in with Google and
            automatically join their project.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium tracking-wider text-muted-foreground">
                EMAIL
              </Label>
              <Input
                type="email"
                placeholder="client@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium tracking-wider text-muted-foreground">
                PROJECT
              </Label>
              <Select value={clientId} onValueChange={setClientId}>
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

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <Button
              onClick={handleInvite}
              disabled={!email.trim() || !clientId || isInviting}
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
            {invites.map((invite) => (
              <Card key={invite.email}>
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{invite.email}</p>
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
                  </div>
                  <button
                    onClick={() => handleRevokeInvite(invite.email)}
                    className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                  >
                    <Cancel01Icon size={16} />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No pending invites. Invites are consumed when the client signs in.
          </p>
        )}
      </div>

      {/* Active Members */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Members</h2>
          <p className="text-sm text-muted-foreground">
            People who have already signed in and have access to a client project.
          </p>
        </div>

        {members.length > 0 ? (
          <div className="space-y-2">
            {members.map((member) => (
              <Card key={member.id}>
                <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {member.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.avatar_url}
                        alt={member.full_name || member.email || ""}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold shrink-0">
                        {(member.full_name || member.email || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.full_name || member.email}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {member.clients?.name ?? "Unknown"}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setMemberToRemove(member)}
                    className="text-muted-foreground hover:text-red-500 transition-colors p-1 shrink-0"
                    title="Remove access"
                  >
                    <Cancel01Icon size={16} />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No members have signed in yet.
          </p>
        )}
      </div>

      {/* Remove member confirmation */}
      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {memberToRemove?.full_name || memberToRemove?.email}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              They&apos;ll lose access to{" "}
              <span className="font-medium">
                {memberToRemove?.clients?.name ?? "this client"}
              </span>{" "}
              immediately. Their requests, comments, and uploads stay intact.
              You can re-invite them later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRemoveMember();
              }}
              disabled={isRemoving}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isRemoving ? "Removing..." : "Remove access"}
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
    </div>
  );
}
