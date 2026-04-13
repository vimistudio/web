import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_REASONS = ["billing", "client_on_hold", "scope_paused", "studio_on_hold", "other"] as const;
type Reason = (typeof VALID_REASONS)[number];

interface PauseBody {
  reason: Reason;
  note?: string | null;
  paused_until?: string | null; // ISO datetime
  visible_to_client?: boolean;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  // Auth + admin check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as PauseBody;
  if (!VALID_REASONS.includes(body.reason)) {
    return NextResponse.json({ error: "invalid_reason" }, { status: 400 });
  }
  if (body.reason === "other" && !body.note?.trim()) {
    return NextResponse.json(
      { error: "note_required_for_other" },
      { status: 400 }
    );
  }

  // Validate paused_until is in the future if provided
  let pausedUntil: string | null = null;
  if (body.paused_until) {
    const d = new Date(body.paused_until);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "invalid_date" }, { status: 400 });
    }
    if (d.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "resume_date_must_be_in_future" },
        { status: 400 }
      );
    }
    pausedUntil = d.toISOString();
  }

  const { error } = await supabase
    .from("clients")
    .update({
      is_active: false,
      paused_reason: body.reason,
      paused_note: body.note?.trim() || null,
      paused_at: new Date().toISOString(),
      paused_until: pausedUntil,
      paused_by: user.id,
      paused_visible_to_client: body.visible_to_client ?? false,
    })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  // DELETE = reactivate (clears all pause metadata)
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("clients")
    .update({
      is_active: true,
      paused_reason: null,
      paused_note: null,
      paused_at: null,
      paused_until: null,
      paused_by: null,
      paused_visible_to_client: false,
    })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
