import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/portal/portal-shell";
import { NoAccess } from "@/components/portal/no-access";
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
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, clients(*)")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return <NoAccess />;
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
