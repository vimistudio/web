import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/portal/portal-shell";
import { NoAccess } from "@/components/portal/no-access";
import { LinkingAccount } from "@/components/portal/linking-account";
import { ImpersonateBanner } from "@/components/portal/impersonate-banner";
import { SetLastVisited } from "@/components/portal/set-last-visited";
import { Toaster } from "@/components/ui/sonner";
import { type Locale } from "@/lib/portal-i18n";
import { fetchClientTeam } from "@/lib/client-team";

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

  // Check if user has a pre-created profile (invite-only gate).
  // Explicit FK hint on the clients embed — avoids PostgREST ambiguity if a
  // future migration adds another FK between clients and profiles (see
  // Decisions/2026-04-13-postgrest-fk-ambiguity-incident).
  let { data: profile } = await supabase
    .from("profiles")
    .select("*, clients!profiles_client_id_fkey(*)")
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
        .select("*, clients!profiles_client_id_fkey(*)")
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
    const selfLocale = (profile.locale as Locale) || "en";
    if (justClaimed) {
      const claimedLocale =
        (profile.locale as Locale) ||
        ((profile.clients as { locale?: string } | null)?.locale as Locale) ||
        "en";
      return <LinkingAccount locale={claimedLocale} />;
    }
    const { data: pendingInvite } = await supabase
      .from("invited_emails")
      .select("email, clients(locale)")
      .eq("email", (user.email ?? "").toLowerCase())
      .maybeSingle();
    if (pendingInvite) {
      const inviteLocale =
        ((pendingInvite.clients as { locale?: string } | null)?.locale as Locale) ||
        selfLocale;
      return <LinkingAccount locale={inviteLocale} />;
    }
    return <NoAccess locale={selfLocale} />;
  }

  // Resolve a client's assigned designer (admin) for the studio card. Clients
  // may read admin profiles (RLS policy from 20260413_allow_clients_to_read_admin_profiles).
  const fetchDesigner = async (designerId: string | null | undefined) => {
    if (!designerId) return null;
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("id", designerId)
      .maybeSingle();
    return data ?? null;
  };

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
      const impersonatedDesigner = await fetchDesigner(
        impersonatedClient.designer_id
      );
      const impersonatedTeam = (
        await fetchClientTeam(supabase, impersonatedClient.id)
      ).map((m) => ({ fullName: m.fullName, avatarUrl: m.avatarUrl }));

      return (
        <>
          <Toaster
            position="bottom-center"
            offset="24px"
            mobileOffset="96px"
            richColors
          />
          <div className="min-h-screen flex flex-col">
            <ImpersonateBanner clientName={impersonatedClient.name} />
            <PortalShell
              user={user}
              profile={clientProfile}
              impersonating
              designer={impersonatedDesigner}
              team={impersonatedTeam}
            >
              {children}
            </PortalShell>
          </div>
        </>
      );
    }
  }

  const designer = await fetchDesigner(
    (profile.clients as { designer_id?: string | null } | null)?.designer_id
  );
  const team = profile.client_id
    ? (await fetchClientTeam(supabase, profile.client_id)).map((m) => ({
        fullName: m.fullName,
        avatarUrl: m.avatarUrl,
      }))
    : [];

  return (
    <>
      <Toaster
        position="bottom-center"
        offset="24px"
        mobileOffset="96px"
        richColors
      />
      <PortalShell user={user} profile={profile} designer={designer} team={team}>
        {children}
      </PortalShell>
    </>
  );
}
