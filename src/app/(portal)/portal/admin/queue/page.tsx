import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminQueueView } from "@/components/portal/admin-queue-view";

export default async function QueuePage() {
  const supabase = createClient();
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

  // Fetch ALL non-done requests across all clients
  const { data: requests } = await supabase
    .from("requests")
    .select(
      "*, clients(name, slug), deliverables(id), comments(id, created_at, author_id)"
    )
    .neq("status", "done")
    .order("priority", { ascending: false })
    .order("updated_at", { ascending: false });

  return <AdminQueueView requests={requests ?? []} adminId={user.id} />;
}
