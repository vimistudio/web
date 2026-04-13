import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GalleryView } from "@/components/portal/gallery-view";

export default async function GalleryPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/portal/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, client_id, clients(name)")
    .eq("id", user.id)
    .single();

  // Check impersonation
  const cookieStore = cookies();
  const impersonateClientId = cookieStore.get("impersonate_client")?.value;
  const clientId =
    profile?.role === "admin" && impersonateClientId
      ? impersonateClientId
      : profile?.client_id;

  if (!clientId) {
    redirect("/portal");
  }

  // Fetch client name
  const { data: client } = await supabase
    .from("clients")
    .select("name")
    .eq("id", clientId)
    .single();

  // Fetch deliverables for this client.
  // Excludes deliverables belonging to archived requests — those shouldn't
  // clutter the gallery view even though the files still exist.
  const { data: deliverables } = await supabase
    .from("deliverables")
    .select("*, requests!inner(title, type, status, client_id, is_archived)")
    .eq("requests.client_id", clientId)
    .eq("requests.is_archived", false)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false });

  // Generate signed URLs for image deliverables
  const withUrls = await Promise.all(
    (deliverables ?? []).map(async (d) => {
      if (d.mime_type?.startsWith("image/")) {
        const { data } = await supabase.storage
          .from("deliverables")
          .createSignedUrl(d.file_path, 3600);
        return { ...d, url: data?.signedUrl ?? null };
      }
      return { ...d, url: null };
    })
  );

  // Fetch social post data for social-post deliverables
  const socialPostDeliverables = withUrls.filter(
    (d) => d.mime_type === "application/vnd.vimi.social-post"
  );

  const socialPostsMap: Record<string, { handle: string; caption: string; slides: { url: string; alt?: string }[]; coverUrl: string | null }> = {};

  for (const d of socialPostDeliverables) {
    const postId = d.file_path.replace("social-posts/", "");
    const { data: post } = await supabase
      .from("social_posts")
      .select("ig_handle, ig_caption")
      .eq("id", postId)
      .single();

    const { data: slides } = await supabase
      .from("social_slides")
      .select("image_path, alt_text, slide_order")
      .eq("post_id", postId)
      .order("slide_order");

    const slideUrls = (slides || [])
      .filter((s) => s.image_path)
      .map((s) => ({
        url: supabase.storage.from("social-slides").getPublicUrl(s.image_path!).data.publicUrl,
        alt: s.alt_text || undefined,
      }));

    socialPostsMap[d.id] = {
      handle: post?.ig_handle || "@handle",
      caption: post?.ig_caption || "",
      slides: slideUrls,
      coverUrl: slideUrls[0]?.url || null,
    };
  }

  return (
    <GalleryView
      clientName={client?.name ?? "Your Project"}
      deliverables={withUrls}
      socialPostsMap={socialPostsMap}
    />
  );
}
