import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminClientsView } from "@/components/portal/admin-clients-view";

export default async function AdminClientsPage() {
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

  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: requests } = await supabase
    .from("requests")
    .select("id, client_id, status");

  // Build summaries
  const clientSummaries = (clients ?? []).map((client) => {
    const clientRequests = (requests ?? []).filter(
      (r) => r.client_id === client.id
    );
    return {
      ...client,
      openCount: clientRequests.filter((r) => r.status !== "done").length,
      doneCount: clientRequests.filter((r) => r.status === "done").length,
    };
  });

  return <AdminClientsView clients={clientSummaries} />;
}
