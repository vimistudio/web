import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/portal/portal-shell";
import { NoAccess } from "@/components/portal/no-access";
import { LinkingAccount } from "@/components/portal/linking-account";
import { ProjectPaused } from "@/components/portal/project-paused";
import { ImpersonateBanner } from "@/components/portal/impersonate-banner";
import { SetLastVisited } from "@/components/portal/set-last-visited";
import { Toaster } from "@/components/ui/sonner";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/portal/login");
  }

  // Check if user has a pre-created profile (invite-only gate)
  let { data: profile } = await supabase
    .from("profiles")
    .select("*, clients(*)")
    .eq("id", user.id)
    .single();

  // Self-healing invite consumption: handle_new_user only fires AFTER INSERT
  // on auth.users, so users who signed in BEFORE being invited (or who were
  // removed and re-invited) end up with a profile but no client_id. The
  // claim_invite() function checks invited_emails for their address and
  // links them on the next portal load — idempotent no-op if no invite.
  //
  // Track whether we just successfully claimed so we can show LinkingAccount
  // (instead of NoAccess) when the post-claim profile refetch returns stale
  // data due to PostgREST replication lag.
  let justClaimed = false;
  if (profile && profile.role === "client" && !profile.client_id) {
    const { data: claimed } = await supabase.rpc("claim_invite");
    if (claimed === true) {
      justClaimed = true;
      const re = await supabase
        .from("profiles")
        .select("*, clients(*)")
        .eq("id", user.id)
        .single();
      profile = re.data;
    }
  }

  // Gate: an authenticated user lacks portal access if their profile row is
  // missing entirely (RLS denied or trigger failed).
  if (!profile) {
    return <NoAccess />;
  }

  // Client without a client_id: distinguish "in-flight link" from
  // "genuinely not invited" so we never show a hostile "no access" to
  // someone we just successfully claimed.
  //   - We just claimed (link committing) → LinkingAccount (auto-refreshes)
  //   - Pending invite still exists for this email → LinkingAccount
  //   - Otherwise → NoAccess (correct for uninvited users)
  if (profile.role === "client" && !profile.client_id) {
    if (justClaimed) {
      return <LinkingAccount />;
    }
    const { data: pendingInvite } = await supabase
      .from("invited_emails")
      .select("email")
      .eq("email", (user.email ?? "").toLowerCase())
      .maybeSingle();
    if (pendingInvite) {
      return <LinkingAccount />;
    }
    return <NoAccess />;
  }

  // Project paused: client members of an inactive client see the warm
  // ProjectPaused page instead of the portal. Admins are unaffected and can
  // continue to view the paused client's board for archival/reactivation.
  // Admins impersonating a paused client also bypass this (so they can
  // sanity-check what the client would have seen — useful for support).
  if (profile.role === "client" && profile.clients && profile.clients.is_active === false) {
    const reasonShown =
      profile.clients.paused_visible_to_client === true
        ? profile.clients.paused_reason ?? null
        : null;
    return (
      <ProjectPaused
        clientName={profile.clients.name}
        pausedUntil={profile.clients.paused_until ?? null}
        reasonShownToClient={reasonShown}
      />
    );
  }

  // Admin impersonation: check cookie
  const cookieStore = cookies();
  const impersonateClientId = cookieStore.get("impersonate_client")?.value;

  if (profile.role === "admin" && impersonateClientId) {
    // Fetch the client being impersonated
    const { data: impersonatedClient } = await supabase
      .from("clients")
      .select("*")
      .eq("id", impersonateClientId)
      .single();

    if (impersonatedClient) {
      // Create a fake client profile for the admin
      const clientProfile = {
        ...profile,
        role: "client" as const,
        client_id: impersonatedClient.id,
        clients: impersonatedClient,
      };

      return (
        <>
          <Toaster position="top-center" richColors />
          <div className="min-h-screen flex flex-col">
            <ImpersonateBanner clientName={impersonatedClient.name} />
            <PortalShell user={user} profile={clientProfile}>
              {children}
            </PortalShell>
          </div>
        </>
      );
    }
  }

  return (
    <>
      <Toaster position="top-center" richColors />
      <PortalShell user={user} profile={profile}>
        {children}
      </PortalShell>
    </>
  );
}
