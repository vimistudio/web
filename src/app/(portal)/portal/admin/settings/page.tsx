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
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/portal");

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

  return (
    <AdminSettingsView
      invites={invites ?? []}
      clients={clients ?? []}
    />
  );
}
