import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { AdminBoard } from "@/components/portal/admin-board";

export default async function AdminClientBoardPage({
  params,
}: {
  params: { slug: string };
}) {
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
  // Fail OPEN (only explicit false = staff) so the sole owner keeps retainer +
  // the client editor during the pre-migration deploy window.
  const isOwner = profile.is_owner !== false;

  // Fetch client by slug
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (!client) notFound();

  // Fetch requests with related data
  // Note: no profiles:created_by join — created_by FK points to auth.users, not profiles
  const { data: requests } = await supabase
    .from("requests")
    .select(
      "*, deliverables(id, file_name, file_path, mime_type), comments(id)"
    )
    .eq("client_id", client.id)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  // Fetch plan milestones for the plan editor
  const { data: milestones } = await supabase
    .from("client_milestones")
    .select(
      "id, track, week, title, description, status, needs_client, request_id, sort, delay_note"
    )
    .eq("client_id", client.id)
    .order("week", { ascending: true })
    .order("sort", { ascending: true });

  // Admin roster for the per-request assignee control (joined in JS, never
  // embedded on requests — keeps requests↔profiles embed-free).
  const { data: admins } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("role", "admin");

  return (
    <AdminBoard
      client={client}
      requests={requests ?? []}
      milestones={milestones ?? []}
      admins={admins ?? []}
      isOwner={isOwner}
    />
  );
}
