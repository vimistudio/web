import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/portal/admin-dashboard";

export default async function AdminDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/portal/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/portal");

  // Fetch all clients with request counts
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // Get request counts per status
  const { data: requests } = await supabase
    .from("requests")
    .select("id, client_id, status, updated_at, title");

  // Get recent comments for activity feed
  // Uses explicit FK hint since author_id has FKs to both auth.users and profiles
  const { data: recentComments } = await supabase
    .from("comments")
    .select("*, profiles!comments_author_id_profiles_fkey(full_name, avatar_url), requests(id, title, client_id)")
    .order("created_at", { ascending: false })
    .limit(10);

  // Aggregate stats
  const totalClients = clients?.length ?? 0;
  const openRequests = requests?.filter(
    (r) => r.status !== "done"
  ).length ?? 0;
  const needsReview = requests?.filter(
    (r) => r.status === "review"
  ).length ?? 0;
  const monthlyRevenue = clients?.reduce(
    (sum, c) => sum + (c.retainer_amount ?? 0),
    0
  ) ?? 0;

  // Build per-client request summaries
  const clientSummaries = (clients ?? []).map((client) => {
    const clientRequests = (requests ?? []).filter(
      (r) => r.client_id === client.id
    );
    return {
      ...client,
      counts: {
        queued: clientRequests.filter((r) => r.status === "queued").length,
        in_progress: clientRequests.filter((r) => r.status === "in_progress").length,
        review: clientRequests.filter((r) => r.status === "review").length,
        done: clientRequests.filter((r) => r.status === "done").length,
      },
    };
  });

  return (
    <AdminDashboard
      stats={{
        totalClients,
        openRequests,
        needsReview,
        monthlyRevenue,
      }}
      clients={clientSummaries}
      recentActivity={recentComments ?? []}
      adminName={profile.full_name ?? undefined}
    />
  );
}
