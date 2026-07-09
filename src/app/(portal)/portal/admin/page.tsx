import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/portal/admin-dashboard";
import { AdminInviteBanner } from "@/components/portal/admin-invite-banner";

export default async function AdminDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/portal/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, is_owner")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/portal");
  // Fail OPEN (only explicit false = staff) so the sole owner keeps revenue
  // during the pre-migration deploy window.
  const isOwner = profile.is_owner !== false;

  // Surface a stale invite addressed to the signed-in admin (they clicked a
  // client invite email but have an admin account).
  const { data: selfInvite } = await supabase
    .from("invited_emails")
    .select("email, client_id, clients(name)")
    .eq("email", user.email?.toLowerCase() ?? "")
    .maybeSingle();

  // Fetch all clients (active + paused). Paused clients are rendered behind a
  // quiet toggle in the dashboard; stats and the attention strip stay active-only.
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  // Get request counts per status. `select *` (no assignee embed) so assignee_id
  // is available for my-work stamping; the admin roster is joined in JS.
  const { data: requests } = await supabase
    .from("requests")
    .select("*");

  // Admin roster for the designer avatar chip on client cards (joined in JS).
  const { data: admins } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("role", "admin");

  // Client-owed plan items (milestones the client still has to tick off)
  const { data: owedMilestones } = await supabase
    .from("client_milestones")
    .select("id, client_id, title, request_id")
    .eq("needs_client", true)
    .eq("client_done", false);

  // Get recent comments for activity feed (exclude admin's own)
  // Uses explicit FK hint since author_id has FKs to both auth.users and profiles
  const { data: recentComments } = await supabase
    .from("comments")
    .select("*, profiles!comments_author_id_profiles_fkey(full_name, avatar_url), requests(id, title, client_id, clients(name))")
    .neq("author_id", user.id)
    .order("created_at", { ascending: false })
    .limit(40);

  // Get recent comments for last-active calculation (last 90 days, capped at 500)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data: allComments } = await supabase
    .from("comments")
    .select("created_at, request_id, requests(client_id)")
    .gte("created_at", ninetyDaysAgo)
    .order("created_at", { ascending: false })
    .limit(500);

  // Aggregate stats — active clients only (paused clients pollute the numbers).
  const activeClients = (clients ?? []).filter((c) => c.is_active);
  const activeClientIds = new Set(activeClients.map((c) => c.id));
  const activeRequests = (requests ?? []).filter((r) =>
    activeClientIds.has(r.client_id)
  );
  const totalClients = activeClients.length;
  const openRequests = activeRequests.filter((r) => r.status !== "done").length;
  const needsReview = activeRequests.filter((r) => r.status === "review").length;
  const monthlyRevenue = activeClients.reduce(
    (sum, c) => sum + (c.retainer_amount ?? 0),
    0
  );
  // Staff-facing neutral stat (no money): requests delivered this calendar
  // month across active clients — derived from the same data we already have.
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const doneThisMonth = activeRequests.filter(
    (r) => r.status === "done" && new Date(r.updated_at) >= monthStart
  ).length;

  // Needs-attention strip (Pareto): the few things that actually need action
  // today, active clients only, ordered review > overdue > owed, capped at 5.
  const clientById = new Map((clients ?? []).map((c) => [c.id, c]));
  const accentFor = (id: string) =>
    (clientById.get(id)?.accent_color as string | null) || "#5B4BD6";
  const nameFor = (id: string) => clientById.get(id)?.name ?? "Client";
  const designerFor = (id: string) => clientById.get(id)?.designer_id ?? null;

  // Whether an attention item belongs to the signed-in admin: assigned to me,
  // OR unassigned when the client's designer is me or the client has no designer
  // (so an ownerless request never goes dark). Identical to the queue predicate.
  const requestIsMine = (r: { assignee_id?: string | null; client_id: string }) => {
    if (r.assignee_id) return r.assignee_id === user.id;
    const designerId = designerFor(r.client_id);
    return designerId === user.id || designerId == null;
  };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const reviewRequests = activeRequests
    .filter((r) => r.status === "review")
    .sort(
      (a, b) =>
        new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
    );
  const reviewRequestIds = new Set(reviewRequests.map((r) => r.id));
  const reviewItems = reviewRequests.map((r) => ({
    id: `review-${r.id}`,
    kind: "review" as const,
    clientName: nameFor(r.client_id),
    clientColor: accentFor(r.client_id),
    text: r.title,
    href: `/portal/requests/${r.id}`,
    mine: requestIsMine(r),
  }));

  const overdueItems = activeRequests
    .filter(
      (r) =>
        r.status !== "done" &&
        r.due_date &&
        new Date(r.due_date) < todayStart &&
        !reviewRequestIds.has(r.id)
    )
    .sort(
      (a, b) =>
        new Date(a.due_date as string).getTime() -
        new Date(b.due_date as string).getTime()
    )
    .map((r) => ({
      id: `overdue-${r.id}`,
      kind: "overdue" as const,
      clientName: nameFor(r.client_id),
      clientColor: accentFor(r.client_id),
      text: r.title,
      href: `/portal/requests/${r.id}`,
      mine: requestIsMine(r),
    }));

  const owedItems = (owedMilestones ?? [])
    .filter((m) => activeClientIds.has(m.client_id))
    .map((m) => ({
      id: `owed-${m.id}`,
      kind: "owed" as const,
      clientName: nameFor(m.client_id),
      clientColor: accentFor(m.client_id),
      text: m.title,
      href: m.request_id
        ? `/portal/requests/${m.request_id}`
        : `/portal/admin/clients/${clientById.get(m.client_id)?.slug ?? ""}`,
      mine: designerFor(m.client_id) === user.id,
    }));

  const attention = [...reviewItems, ...overdueItems, ...owedItems].slice(0, 5);

  // Recent activity defaults to active clients only (a paused client's stale
  // comments are pure noise on the overview).
  const activeActivity = (recentComments ?? [])
    .filter((c) => {
      const req = c.requests as { client_id: string } | null;
      return req ? activeClientIds.has(req.client_id) : false;
    })
    .slice(0, 10);

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
    <>
      {selfInvite?.client_id && (
        <AdminInviteBanner
          email={selfInvite.email}
          clientId={selfInvite.client_id}
          clientName={selfInvite.clients?.name ?? "your project"}
        />
      )}
      <AdminDashboard
        stats={{
          totalClients,
          openRequests,
          needsReview,
          monthlyRevenue,
          doneThisMonth,
          activeClientCount: totalClients,
        }}
        clients={clientSummaries}
        recentActivity={activeActivity}
        attention={attention}
        adminName={profile.full_name ?? undefined}
        adminId={user.id}
        admins={admins ?? []}
        isOwner={isOwner}
      />
    </>
  );
}
