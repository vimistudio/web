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

  if (!profile?.client_id && profile?.role !== "admin") {
    redirect("/portal");
  }

  // Fetch deliverables for this client's completed/review requests
  const { data: deliverables } = await supabase
    .from("deliverables")
    .select(
      "*, requests!inner(title, type, status, client_id)"
    )
    .eq("requests.client_id", profile.client_id!)
    .order("created_at", { ascending: false });

  const clientName =
    (profile.clients as { name: string } | null)?.name ?? "Your Project";

  return (
    <GalleryView
      clientName={clientName}
      deliverables={deliverables ?? []}
    />
  );
}
