import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ requests: [], comments: [], deliverables: [] });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, client_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "No profile" }, { status: 403 });
  }

  const isAdmin = profile.role === "admin";
  const pattern = `%${query}%`;

  // Search requests
  let requestsQuery = supabase
    .from("requests")
    .select("id, title, description, type, status, client_id, clients(name)")
    .or(`title.ilike.${pattern},description.ilike.${pattern}`)
    .limit(5);

  if (!isAdmin && profile.client_id) {
    requestsQuery = requestsQuery.eq("client_id", profile.client_id);
  }

  const { data: requests } = await requestsQuery;

  // Search comments
  // Use !inner join so .eq on the joined table works as a WHERE clause
  let commentsQuery = supabase
    .from("comments")
    .select(
      isAdmin
        ? "id, body, created_at, request_id, requests(id, title)"
        : "id, body, created_at, request_id, requests!inner(id, title, client_id)"
    )
    .ilike("body", pattern)
    .limit(5);

  if (!isAdmin && profile.client_id) {
    commentsQuery = commentsQuery.eq("requests.client_id", profile.client_id);
  }

  const { data: comments } = await commentsQuery;

  // Search deliverables
  let deliverablesQuery = supabase
    .from("deliverables")
    .select(
      isAdmin
        ? "id, file_name, mime_type, request_id, requests(id, title)"
        : "id, file_name, mime_type, request_id, requests!inner(id, title, client_id)"
    )
    .ilike("file_name", pattern)
    .limit(5);

  if (!isAdmin && profile.client_id) {
    deliverablesQuery = deliverablesQuery.eq("requests.client_id", profile.client_id);
  }

  const { data: deliverables } = await deliverablesQuery;

  return NextResponse.json({
    requests: requests ?? [],
    comments: comments ?? [],
    deliverables: deliverables ?? [],
  });
}
