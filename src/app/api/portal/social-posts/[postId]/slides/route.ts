import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const supabase = await createClient();
    const { postId } = await params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current max slide_order
    const { data: existing } = await supabase
      .from("social_slides")
      .select("slide_order")
      .eq("post_id", postId)
      .order("slide_order", { ascending: false })
      .limit(1);

    const nextOrder = existing && existing.length > 0 ? existing[0].slide_order + 1 : 0;

    const { data, error } = await supabase
      .from("social_slides")
      .insert({
        post_id: postId,
        slide_order: nextOrder,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Batch reorder slides
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const supabase = await createClient();
    const { postId } = await params;
    const body = await request.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slides } = body as { slides: { id: string; slide_order: number }[] };

    if (!slides || !Array.isArray(slides)) {
      return NextResponse.json({ error: "slides array is required" }, { status: 400 });
    }

    // Update each slide's order
    const updates = slides.map((s) =>
      supabase
        .from("social_slides")
        .update({ slide_order: s.slide_order })
        .eq("id", s.id)
        .eq("post_id", postId)
    );

    await Promise.all(updates);

    // Return updated slides
    const { data, error } = await supabase
      .from("social_slides")
      .select()
      .eq("post_id", postId)
      .order("slide_order");

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
