import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminSettingsView } from "@/components/portal/admin-settings-view";

export default async function AdminSettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/portal/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_owner")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/portal");
  // Settings (people management + studio config) is owner-only. Fail OPEN so
  // the sole owner isn't locked out pre-migration (only explicit false = staff).
  if (profile.is_owner === false) redirect("/portal/admin");

  // Fetch pending invites
  const { data: invites } = await supabase
    .from("invited_emails")
    .select("*, clients(name)")
    .order("created_at", { ascending: false });

  // Fetch all clients for the invite form dropdown
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("name");

  // Fetch ALL profiles for the Team & Roles section
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, client_id, role, first_login_at, created_at, clients!profiles_client_id_fkey(id, name)")
    .order("created_at", { ascending: false });

  return (
    <AdminSettingsView
      invites={invites ?? []}
      clients={clients ?? []}
      profiles={profiles ?? []}
      currentUserId={user.id}
    />
  );
}
