import { cookies } from "next/headers";
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

  // Determine the client scope for this search:
  //   - Real clients: their own client_id.
  //   - Admins impersonating a client (impersonate_client cookie): that
  //     client's id, so the preview is scoped exactly like a real client.
  //   - Admins otherwise: no scope (studio-wide search).
  let scopeClientId: string | null = null;

  if (!isAdmin) {
    if (profile.client_id) {
      scopeClientId = profile.client_id;
    }
  } else {
    const impersonateClientId = cookies().get("impersonate_client")?.value;
    if (impersonateClientId) {
      // Validate the cookie points at a real client before trusting it.
      const { data: impersonatedClient } = await supabase
        .from("clients")
        .select("id")
        .eq("id", impersonateClientId)
        .single();
      if (impersonatedClient) {
        scopeClientId = impersonatedClient.id;
      }
    }
  }

  const scoped = scopeClientId !== null;
  const pattern = `%${query}%`;

  // Search requests
  let requestsQuery = supabase
    .from("requests")
    .select("id, title, description, type, status, client_id, clients(name)")
    .or(`title.ilike.${pattern},description.ilike.${pattern}`)
    .limit(5);

  if (scopeClientId) {
    requestsQuery = requestsQuery.eq("client_id", scopeClientId);
  }

  const { data: requests } = await requestsQuery;

  // Search comments
  // Use !inner join so .eq on the joined table works as a WHERE clause
  let commentsQuery = supabase
    .from("comments")
    .select(
      scoped
        ? "id, body, created_at, request_id, requests!inner(id, title, client_id)"
        : "id, body, created_at, request_id, requests(id, title)"
    )
    .ilike("body", pattern)
    .limit(5);

  if (scopeClientId) {
    commentsQuery = commentsQuery.eq("requests.client_id", scopeClientId);
  }

  const { data: comments } = await commentsQuery;

  // Search deliverables
  let deliverablesQuery = supabase
    .from("deliverables")
    .select(
      scoped
        ? "id, file_name, mime_type, request_id, requests!inner(id, title, client_id)"
        : "id, file_name, mime_type, request_id, requests(id, title)"
    )
    .ilike("file_name", pattern)
    .limit(5);

  if (scopeClientId) {
    deliverablesQuery = deliverablesQuery.eq("requests.client_id", scopeClientId);
  }

  const { data: deliverables } = await deliverablesQuery;

  return NextResponse.json({
    requests: requests ?? [],
    comments: comments ?? [],
    deliverables: deliverables ?? [],
  });
}
