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
    .select("id, client_id, status, updated_at, created_at, title");

  // Get recent comments for activity feed (exclude admin's own)
  // Uses explicit FK hint since author_id has FKs to both auth.users and profiles
  const { data: recentComments } = await supabase
    .from("comments")
    .select("*, profiles!comments_author_id_profiles_fkey(full_name, avatar_url), requests(id, title, client_id, clients(name))")
    .neq("author_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Get recent comments for last-active calculation (last 90 days, capped at 500)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data: allComments } = await supabase
    .from("comments")
    .select("created_at, request_id, requests(client_id)")
    .gte("created_at", ninetyDaysAgo)
    .order("created_at", { ascending: false })
    .limit(500);

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

  // Build per-client request summaries with hot requests and last-active
  const clientSummaries = (clients ?? []).map((client) => {
    const clientRequests = (requests ?? []).filter(
      (r) => r.client_id === client.id
    );

    // Hot requests: "review" status, most recently updated, top 2
    const hotRequests = clientRequests
      .filter((r) => r.status === "review")
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 2)
      .map((r) => ({ id: r.id, title: r.title, status: r.status }));

    // Last active: max of request updated_at, request created_at, and comment created_at for this client
    const requestTimestamps = clientRequests.flatMap((r) => [r.updated_at, r.created_at]);
    const commentTimestamps = (allComments ?? [])
      .filter((c) => {
        const req = c.requests as { client_id: string } | null;
        return req?.client_id === client.id;
      })
      .map((c) => c.created_at);
    const allTimestamps = [...requestTimestamps, ...commentTimestamps].filter(Boolean);
    const lastActiveAt = allTimestamps.length > 0
      ? allTimestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
      : null;

    return {
      ...client,
      counts: {
        queued: clientRequests.filter((r) => r.status === "queued").length,
        in_progress: clientRequests.filter((r) => r.status === "in_progress").length,
        review: clientRequests.filter((r) => r.status === "review").length,
        done: clientRequests.filter((r) => r.status === "done").length,
      },
      hotRequests,
      lastActiveAt,
    };
  });

  return (
    <AdminDashboard
      stats={{
        totalClients,
        openRequests,
        needsReview,
        monthlyRevenue,
        activeClientCount: totalClients,
      }}
      clients={clientSummaries}
      recentActivity={recentComments ?? []}
      adminName={profile.full_name ?? undefined}
    />
  );
}
