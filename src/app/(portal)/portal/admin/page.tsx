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

  // Fetch all clients (active + paused) — we display them in separate sections.
  const { data: allClientsRaw } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  const clients = (allClientsRaw ?? []).filter((c) => c.is_active);
  const activeClientIdSet = new Set(clients.map((c) => c.id));

  // Get request counts per status — only for active clients (paused clients
  // shouldn't pollute open-request totals or hot-request lists).
  const { data: allRequests } = await supabase
    .from("requests")
    .select("id, client_id, status, updated_at, created_at, title");
  const requests = (allRequests ?? []).filter((r) =>
    activeClientIdSet.has(r.client_id)
  );

  // Recent comments — exclude admin's own AND any from paused clients.
  // Fetch extra so post-filter we can still show the latest 10.
  const { data: recentCommentsRaw } = await supabase
    .from("comments")
    .select("*, profiles!comments_author_id_profiles_fkey(full_name, avatar_url), requests(id, title, client_id, clients(name, is_active))")
    .neq("author_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const recentComments = (recentCommentsRaw ?? [])
    .filter((c) => {
      const r = (c as { requests?: { clients?: { is_active?: boolean } | null } | null }).requests;
      return r?.clients?.is_active !== false;
    })
    .slice(0, 10);

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
