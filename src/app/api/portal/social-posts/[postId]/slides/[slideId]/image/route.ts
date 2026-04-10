import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// PATCH: Update slide's image_path after client-side upload to Supabase Storage
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ postId: string; slideId: string }> }
) {
  try {
    const supabase = await createClient();
    const { postId, slideId } = await params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { image_path } = await request.json();
    if (!image_path) {
      return NextResponse.json({ error: "image_path is required" }, { status: 400 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("social-slides")
      .getPublicUrl(image_path);

    // Update the slide record
    const { data: slide, error } = await supabase
      .from("social_slides")
      .update({ image_path })
      .eq("id", slideId)
      .eq("post_id", postId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      ...slide,
      url: urlData.publicUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ postId: string; slideId: string }> }
) {
  try {
    const supabase = await createClient();
    const { postId, slideId } = await params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get slide to find storage path
    const { data: slide } = await supabase
      .from("social_slides")
      .select("image_path")
      .eq("id", slideId)
      .eq("post_id", postId)
      .single();

    // Delete from storage if image exists
    if (slide?.image_path) {
      await supabase.storage.from("social-slides").remove([slide.image_path]);
    }

    // Delete slide record
    const { error } = await supabase
      .from("social_slides")
      .delete()
      .eq("id", slideId)
      .eq("post_id", postId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
