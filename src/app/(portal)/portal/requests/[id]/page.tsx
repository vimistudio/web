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

  // Request creator + client member count. We only surface "Created by …" when
  // the client has 2+ members (otherwise the author is obvious). Profiles are
  // readable within the same client team (RLS), so the name resolves for both
  // client members and admins.
  const [{ data: creatorProfile }, { count: memberCount }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", request.created_by)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("client_id", request.client_id),
  ]);
  const creatorName = creatorProfile?.full_name ?? null;

  // Assigned designer name (for the conversation eyebrow + queue callout).
  const { data: assigneeProfile } = request.assignee_id
    ? await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", request.assignee_id)
        .maybeSingle()
    : { data: null };
  const assigneeName = assigneeProfile?.full_name ?? null;

  // Queue position — REAL rank among THIS client's open (queued/in_progress)
  // requests, in the SAME global order the admin drags in the queue:
  // queue_rank asc (nulls last), then priority desc, then created_at asc. The
  // client's position is their index within their own open requests in that
  // order, so "Posición #N" mirrors the admin's reprioritization. Only
  // meaningful while the request itself is open; null otherwise.
  let queuePosition: number | null = null;
  if (request.status === "queued" || request.status === "in_progress") {
    const { data: openRequests } = await supabase
      .from("requests")
      .select("id")
      .eq("client_id", request.client_id)
      .eq("is_archived", false)
      .in("status", ["queued", "in_progress"])
      .order("queue_rank", { ascending: true, nullsFirst: false })
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true });
    if (openRequests) {
      const idx = openRequests.findIndex((r) => r.id === request.id);
      if (idx >= 0) queuePosition = idx + 1;
    }
  }

  // Admin roster for the assignee control (admins only; joined in JS, never
  // embedded on the request — keeps requests↔profiles embed-free).
  const { data: admins } =
    profile.role === "admin"
      ? await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .eq("role", "admin")
      : { data: [] };

  // Fetch social posts for this request (if any)
  const { data: socialPosts } = await supabase
    .from("social_posts")
    .select("*, social_slides(id, slide_order, image_path, alt_text), deliverable_events(id, social_post_id, user_id, event_type, comment, created_at)")
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
      creatorName={creatorName}
      assigneeName={assigneeName}
      queuePosition={queuePosition}
      memberCount={memberCount ?? 1}
      currentUserId={user.id}
      isAdmin={profile.role === "admin" && !isImpersonating}
      isImpersonating={isImpersonating}
      activityLog={activityLog ?? []}
      socialPosts={socialPostsWithUrls}
      admins={admins ?? []}
    />
  );
}
