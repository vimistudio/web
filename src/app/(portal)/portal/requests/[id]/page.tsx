import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { RequestDetail } from "@/components/portal/request-detail";

export default async function RequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/portal/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, client_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/portal/login");

  // Fetch request with all related data
  const { data: request } = await supabase
    .from("requests")
    .select(
      `*,
      clients(name, slug),
      deliverables(id, file_name, file_path, file_size, mime_type, created_at),
      reference_images(id, file_name, file_path, file_size, mime_type, created_at),
      comments(id, body, created_at, author_id, profiles:author_id(full_name, avatar_url))`
    )
    .eq("id", params.id)
    .single();

  if (!request) notFound();

  // Authorization: admin can see all, clients only their own
  if (profile.role !== "admin" && profile.client_id !== request.client_id) {
    notFound();
  }

  // Sort comments chronologically
  const sortedComments = [...(request.comments ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <RequestDetail
      request={{ ...request, comments: sortedComments }}
      currentUserId={user.id}
      isAdmin={profile.role === "admin"}
    />
  );
}
