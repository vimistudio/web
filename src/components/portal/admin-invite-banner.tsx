"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { applyInvite } from "@/lib/portal/invites";
import { toast } from "sonner";

interface AdminInviteBannerProps {
  email: string;
  clientId: string;
  clientName: string;
}

export function AdminInviteBanner({
  email,
  clientId,
  clientName,
}: AdminInviteBannerProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const becomeClient = async () => {
    setBusy(true);
    const supabase = createClient();
    const result = await applyInvite(supabase, { email, clientId });
    if (result.error && !result.partial) {
      setBusy(false);
      toast.error(result.error);
      return;
    }
    if (result.partial) {
      toast.error(`You're now a client, but the invite couldn't be cleared.`);
    } else {
      toast.success(`You're now a client of ${clientName}`);
    }
    router.push("/portal");
    router.refresh();
  };

  const dismiss = async () => {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("invited_emails")
      .delete()
      .eq("email", email);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Invite dismissed");
    router.refresh();
  };

  return (
    <div className="rounded-xl border border-[#F3D9A6] bg-[#FFF8ED] px-4 py-4 mb-6">
      <p className="text-sm text-[color:var(--status-review-ink)]">
        You were invited to{" "}
        <span className="font-medium">{clientName}</span> as a client, but
        you&apos;re signed in as an <span className="font-medium">Admin</span>.
      </p>
      <div className="flex flex-wrap gap-2 mt-3">
        <Button
          onClick={becomeClient}
          disabled={busy}
          className="bg-[var(--vimi-ink)] hover:bg-[var(--vimi-ink)]/90"
        >
          {busy ? "Working..." : `Become ${clientName} client`}
        </Button>
        <Button
          onClick={dismiss}
          disabled={busy}
          variant="outline"
          className="bg-white"
        >
          Dismiss invite
        </Button>
      </div>
    </div>
  );
}
