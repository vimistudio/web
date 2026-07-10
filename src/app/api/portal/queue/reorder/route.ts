import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Admin-only queue reprioritization. The client sends one or more
// { id, queue_rank } pairs — a single row for a midpoint move, or the whole
// list when ranks need to be seeded/re-sequenced. queue_rank is a global
// (cross-client) double; the client's own "Posición #N" is derived from the
// same ordering, so a drag here is what the client sees. RLS (admins-manage-all)
// is the real gate; this check just fails fast with a clean status.
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
    const updates: unknown = body?.updates;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "updates must be a non-empty array" },
        { status: 400 }
      );
    }

    const clean: { id: string; queue_rank: number }[] = [];
    for (const u of updates) {
      const id = (u as { id?: unknown })?.id;
      const rank = (u as { queue_rank?: unknown })?.queue_rank;
      if (typeof id !== "string" || typeof rank !== "number" || !isFinite(rank)) {
        return NextResponse.json(
          { error: "each update needs a string id and a finite queue_rank" },
          { status: 400 }
        );
      }
      clean.push({ id, queue_rank: rank });
    }

    const results = await Promise.all(
      clean.map((u) =>
        supabase
          .from("requests")
          .update({ queue_rank: u.queue_rank })
          .eq("id", u.id)
      )
    );

    const failed = results.find((r) => r.error);
    if (failed?.error) {
      return NextResponse.json(
        { error: failed.error.message ?? "Failed to reorder" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, updated: clean.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
