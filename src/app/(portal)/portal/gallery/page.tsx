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

  // Fetch deliverables for this client
  const { data: deliverables } = await supabase
    .from("deliverables")
    .select("*, requests!inner(title, type, status, client_id)")
    .eq("requests.client_id", clientId)
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

  return (
    <GalleryView
      clientName={client?.name ?? "Your Project"}
      deliverables={withUrls}
    />
  );
}
