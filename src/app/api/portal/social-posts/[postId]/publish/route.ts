import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
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

    // Get the post with its request info
    const { data: post, error: fetchError } = await supabase
      .from("social_posts")
      .select("*, requests(client_id, title)")
      .eq("id", postId)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.status === "published") {
      return NextResponse.json({ error: "Already published" }, { status: 400 });
    }

    // Check slides exist
    const { count } = await supabase
      .from("social_slides")
      .select("id", { count: "exact", head: true })
      .eq("post_id", postId)
      .not("image_path", "is", null);

    if (!count || count === 0) {
      return NextResponse.json({ error: "No slides with images to publish" }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Update post status
    const { error: updateError } = await supabase
      .from("social_posts")
      .update({ status: "published", published_at: now, updated_at: now })
      .eq("id", postId);

    if (updateError) throw updateError;

    // Create bridge deliverable row so it appears in gallery
    const postTitle = post.ig_handle
      ? `${post.ig_handle} — Instagram Carousel`
      : "Instagram Carousel";

    const { error: deliverableError } = await supabase
      .from("deliverables")
      .insert({
        request_id: post.request_id,
        file_name: postTitle,
        file_path: `social-posts/${postId}`,
        mime_type: "application/vnd.vimi.social-post",
        uploaded_by: user.id,
      });

    if (deliverableError) throw deliverableError;

    return NextResponse.json({ success: true, published_at: now });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
