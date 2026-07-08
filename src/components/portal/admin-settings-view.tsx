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
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { TeamRolesSection, type Profile } from "@/components/portal/team-roles-section";

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

interface AdminSettingsViewProps {
  invites: Invite[];
  clients: Client[];
  profiles: Profile[];
  currentUserId: string;
}

export function AdminSettingsView({
  invites,
  clients,
  profiles,
  currentUserId,
}: AdminSettingsViewProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [clientId, setClientId] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState("");

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

      {/* Team & Roles */}
      <TeamRolesSection
        profiles={profiles}
        clients={clients}
        currentUserId={currentUserId}
      />

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
