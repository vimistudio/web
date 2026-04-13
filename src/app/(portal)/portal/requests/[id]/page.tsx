import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { RequestDetail } from "@/components/portal/request-detail";

export default async function RequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/portal/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, client_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/portal/login");

  // Check impersonation
  const cookieStore = cookies();
  const impersonateClientId = cookieStore.get("impersonate_client")?.value;
  const isImpersonating = profile.role === "admin" && !!impersonateClientId;

  // Fetch request with all related data
  const { data: request } = await supabase
    .from("requests")
    .select(
      `*,
      clients(name, slug),
      deliverables(*),
      reference_images(id, file_name, file_path, file_size, mime_type, created_at),
      comments(id, body, created_at, author_id, attachment_path, attachment_name, attachment_type, profiles!comments_author_id_profiles_fkey(full_name, avatar_url, role))`
    )
    .eq("id", params.id)
    .single();

  if (!request) notFound();

  // Authorization: admin can see all, clients only their own
  if (profile.role !== "admin" && profile.client_id !== request.client_id) {
    notFound();
  }

  // Fetch deliverable events (views + downloads) with profile names
  const deliverableIds = (request.deliverables ?? []).map((d) => d.id);
  const { data: deliverableEvents } = deliverableIds.length > 0
    ? await supabase
        .from("deliverable_events")
        .select("*, profiles(full_name)")
        .in("deliverable_id", deliverableIds)
        .order("created_at", { ascending: false })
        .limit(100)
    : { data: [] };

  // Generate signed URLs for deliverables (private bucket)
  const deliverableUrls = await Promise.all(
    (request.deliverables ?? []).map(async (d) => {
      const { data } = await supabase.storage
        .from("deliverables")
        .createSignedUrl(d.file_path, 3600);
      const events = (deliverableEvents ?? []).filter((e) => e.deliverable_id === d.id);
      return { ...d, url: data?.signedUrl ?? null, deliverable_events: events };
    })
  );

  // Generate signed URLs for reference images (private bucket)
  const referenceUrls = await Promise.all(
    (request.reference_images ?? []).map(async (ref) => {
      const { data } = await supabase.storage
        .from("references")
        .createSignedUrl(ref.file_path, 3600);
      return { ...ref, url: data?.signedUrl ?? null };
    })
  );

  // Sort comments chronologically + generate signed URLs for attachments
  const sortedComments = await Promise.all(
    [...(request.comments ?? [])]
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      .map(async (c) => {
        if (c.attachment_path) {
          const { data } = await supabase.storage
            .from("references")
            .createSignedUrl(c.attachment_path, 3600);
          return { ...c, attachment_url: data?.signedUrl ?? null };
        }
        return { ...c, attachment_url: null };
      })
  );

  // Fetch activity log
  const { data: activityLog } = await supabase
    .from("activity_log")
    .select("*, profiles:actor_id(full_name, avatar_url)")
    .eq("request_id", params.id)
    .order("created_at", { ascending: true });

  const clientName = request.clients?.name ?? "Client";

  // Fetch social posts for this request (if any)
  const { data: socialPosts } = await supabase
    .from("social_posts")
    .select("*, social_slides(id, slide_order, image_path, alt_text)")
    .eq("request_id", params.id)
    .eq("status", "published");

  // Resolve public URLs for social slides
  const socialPostsWithUrls = (socialPosts || []).map((post) => ({
    ...post,
    social_slides: ((post.social_slides as { id: string; slide_order: number; image_path: string | null; alt_text: string | null }[]) || [])
      .sort((a, b) => a.slide_order - b.slide_order)
      .map((s) => ({
        ...s,
        url: s.image_path
          ? supabase.storage.from("social-slides").getPublicUrl(s.image_path).data.publicUrl
          : null,
      })),
  }));

  return (
    <RequestDetail
      request={{
        ...request,
        deliverables: deliverableUrls,
        reference_images: referenceUrls,
        comments: sortedComments,
      }}
      clientName={clientName}
      currentUserId={user.id}
      isAdmin={profile.role === "admin" && !isImpersonating}
      isImpersonating={isImpersonating}
      activityLog={activityLog ?? []}
      socialPosts={socialPostsWithUrls}
    />
  );
}
