import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** Strip a trailing version suffix like " (v2)" so reused briefs start clean. */
function stripVersion(title: string): string {
  return title.replace(/\s*\(v\d+\)\s*$/i, "").trim();
}

// Reuse a delivered request as a brand-new brief for another client.
// Admin-only. The new request lands in the target client's queue, links back
// to its source via reused_from_request_id (studio memory — never shown to
// clients), and copies the source's type/title/description verbatim.
export async function POST(request: Request) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const sourceRequestId: string | undefined = body?.source_request_id;
    const targetClientId: string | undefined = body?.target_client_id;

    if (!sourceRequestId || !targetClientId) {
      return NextResponse.json(
        { error: "source_request_id and target_client_id are required" },
        { status: 400 }
      );
    }

    const { data: source, error: sourceError } = await supabase
      .from("requests")
      .select("id, type, title, description")
      .eq("id", sourceRequestId)
      .single();

    if (sourceError || !source) {
      return NextResponse.json({ error: "Source request not found" }, { status: 404 });
    }

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, name")
      .eq("id", targetClientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Target client not found" }, { status: 404 });
    }

    const title = stripVersion(source.title);

    const { data: created, error: insertError } = await supabase
      .from("requests")
      .insert({
        client_id: targetClientId,
        created_by: user.id,
        title,
        description: source.description,
        type: source.type,
        status: "queued",
        reused_from_request_id: source.id,
      })
      .select("id, title")
      .single();

    if (insertError || !created) {
      return NextResponse.json(
        { error: insertError?.message ?? "Failed to create brief" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      request_id: created.id,
      title: created.title,
      client_name: client.name,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
