import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { SocialMediaBuilder } from "@/components/portal/social/social-media-builder";

export default async function NewSocialPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ requestId?: string }>;
}) {
  const supabase = await createClient();
  const { slug } = await params;
  const { requestId } = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/portal");

  // Fetch client
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("slug", slug)
    .single();
  if (!client) notFound();

  if (!requestId) {
    redirect(`/portal/admin/clients/${slug}`);
  }

  // Check if a draft already exists for this request
  const { data: existingPost } = await supabase
    .from("social_posts")
    .select("id")
    .eq("request_id", requestId)
    .eq("status", "draft")
    .maybeSingle();

  let postId: string;

  if (existingPost) {
    postId = existingPost.id;
  } else {
    // Create a new draft
    const { data: newPost, error } = await supabase
      .from("social_posts")
      .insert({
        request_id: requestId,
        created_by: user.id,
      })
      .select()
      .single();

    if (error || !newPost) {
      redirect(`/portal/admin/clients/${slug}`);
    }
    postId = newPost.id;
  }

  // Fetch post with slides
  const { data: post } = await supabase
    .from("social_posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (!post) notFound();

  const { data: slides } = await supabase
    .from("social_slides")
    .select("*")
    .eq("post_id", postId)
    .order("slide_order");

  // Resolve public URLs for slides with images
  const slidesWithUrls = (slides || []).map((s) => ({
    ...s,
    url: s.image_path
      ? supabase.storage.from("social-slides").getPublicUrl(s.image_path).data
          .publicUrl
      : null,
  }));

  return (
    <SocialMediaBuilder
      postId={postId}
      requestId={requestId}
      clientName={client.name}
      clientSlug={client.slug}
      initialPost={{
        ig_handle: post.ig_handle,
        ig_caption: post.ig_caption,
        status: post.status,
      }}
      initialSlides={slidesWithUrls}
    />
  );
}
