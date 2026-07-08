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
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/portal");

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

  return (
    <AdminBoard
      client={client}
      requests={requests ?? []}
      milestones={milestones ?? []}
    />
  );
}
