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
    .select("role, is_owner")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/portal");
  // Fail OPEN (only explicit false = staff) so the sole owner keeps the
  // owner-only purge action during the pre-migration deploy window.
  const isOwner = profile.is_owner !== false;

  // Fetch ALL non-done requests across all clients (is_active drives the
  // default active-only view; paused clients are togglable client-side).
  // Order mirrors the admin work order: queue_rank asc (nulls last), then
  // priority desc, then created_at asc — the same order the client's queue
  // position is derived from.
  const { data: requests } = await supabase
    .from("requests")
    .select(
      "*, clients(name, slug, is_active, designer_id, accent_color), deliverables(id), comments(id, created_at, author_id)"
    )
    .neq("status", "done")
    .order("queue_rank", { ascending: true, nullsFirst: false })
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true });

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
      isOwner={isOwner}
    />
  );
}
