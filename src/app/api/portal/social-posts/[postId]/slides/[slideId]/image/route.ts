import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Get the request's client_id for the storage path
    const { data: post } = await supabase
      .from("social_posts")
      .select("request_id, requests(client_id)")
      .eq("id", postId)
      .single();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const clientId = (post.requests as { client_id: string } | null)?.client_id || "unknown";
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `${clientId}/${postId}/${timestamp}-${safeName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("social-slides")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("social-slides")
      .getPublicUrl(storagePath);

    // Update the slide record
    const { data: slide, error: updateError } = await supabase
      .from("social_slides")
      .update({ image_path: storagePath })
      .eq("id", slideId)
      .eq("post_id", postId)
      .select()
      .single();

    if (updateError) throw updateError;

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
