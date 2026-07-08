import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminQueueView } from "@/components/portal/admin-queue-view";

export default async function QueuePage() {
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

  // Fetch ALL non-done requests across all clients (is_active drives the
  // default active-only view; paused clients are togglable client-side)
  const { data: requests } = await supabase
    .from("requests")
    .select(
      "*, clients(name, slug, is_active), deliverables(id), comments(id, created_at, author_id)"
    )
    .neq("status", "done")
    .order("priority", { ascending: false })
    .order("updated_at", { ascending: false });

  // Admin roster for the read-only assignee avatars (joined in JS, no embed).
  const { data: admins } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("role", "admin");

  return (
    <AdminQueueView
      requests={requests ?? []}
      adminId={user.id}
      admins={admins ?? []}
    />
  );
}
