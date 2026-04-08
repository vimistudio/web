import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/portal/portal-shell";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, clients(*)")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Auto-create profile if trigger didn't fire
    const { data: newProfile } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        full_name:
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          user.email,
        avatar_url:
          user.user_metadata?.avatar_url ??
          user.user_metadata?.picture ??
          null,
      })
      .select("*, clients(*)")
      .single();

    if (!newProfile) {
      // Sign out to break the loop, then redirect
      await supabase.auth.signOut();
      redirect("/portal/login?error=profile_creation_failed");
    }

    return (
      <PortalShell user={user} profile={newProfile}>
        {children}
      </PortalShell>
    );
  }

  return (
    <PortalShell user={user} profile={profile}>
      {children}
    </PortalShell>
  );
}
