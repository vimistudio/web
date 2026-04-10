import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

    const { ig_handle, ig_caption, cover_slide_idx } = body;

    const { data, error } = await supabase
      .from("social_posts")
      .update({
        ...(ig_handle !== undefined && { ig_handle }),
        ...(ig_caption !== undefined && { ig_caption }),
        ...(cover_slide_idx !== undefined && { cover_slide_idx }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const supabase = await createClient();
    const { postId } = await params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("social_posts")
      .delete()
      .eq("id", postId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
