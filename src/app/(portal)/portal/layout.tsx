import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/portal/portal-shell";
import { NoAccess } from "@/components/portal/no-access";

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
    // No profile = not invited. Show access denied.
    return <NoAccess />;
  }

  return (
    <PortalShell user={user} profile={profile}>
      {children}
    </PortalShell>
  );
}
