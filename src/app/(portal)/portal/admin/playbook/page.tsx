import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  PlaybookView,
  type PlaybookPiece,
  type PlaybookStats,
  type PlaybookClient,
} from "@/components/portal/playbook-view";

export default async function AdminPlaybookPage() {
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

  // All delivered work across every client — the studio's shared memory.
  const { data: completed } = await supabase
    .from("requests")
    .select(
      "id, title, type, description, updated_at, assignee_id, clients(name, slug, accent_color), deliverables(id, file_name, file_path, file_size, mime_type)"
    )
    .eq("status", "done")
    .eq("is_archived", false)
    .order("updated_at", { ascending: false });

  const done = completed ?? [];

  // Resolve assignee names in one query (no N+1).
  const assigneeIds = Array.from(
    new Set(done.map((r) => r.assignee_id).filter((v): v is string => !!v))
  );
  const assigneeNames = new Map<string, string>();
  if (assigneeIds.length > 0) {
    const { data: assignees } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", assigneeIds);
    (assignees ?? []).forEach((a) => {
      if (a.full_name) assigneeNames.set(a.id, a.full_name);
    });
  }

  // Reuse lineage in ONE grouped query: every request that was spawned from a
  // source piece. Build count + "reusado en" list keyed by source id.
  const { data: reuseRows } = await supabase
    .from("requests")
    .select("id, title, created_at, reused_from_request_id, clients(name)")
    .not("reused_from_request_id", "is", null)
    .order("created_at", { ascending: false });

  const reusedIn = new Map<
    string,
    { id: string; title: string; client: string; createdAt: string }[]
  >();
  (reuseRows ?? []).forEach((row) => {
    const sourceId = row.reused_from_request_id;
    if (!sourceId) return;
    const client = row.clients as { name: string } | null;
    const list = reusedIn.get(sourceId) ?? [];
    list.push({
      id: row.id,
      title: row.title,
      client: client?.name ?? "—",
      createdAt: row.created_at,
    });
    reusedIn.set(sourceId, list);
  });

  // Signed URLs for the first image deliverable of each piece.
  const pieces: PlaybookPiece[] = await Promise.all(
    done.map(async (r) => {
      const client = r.clients as {
        name: string;
        slug: string;
        accent_color: string | null;
      } | null;
      const deliverables = (r.deliverables ?? []) as {
        id: string;
        file_name: string;
        file_path: string;
        file_size: number | null;
        mime_type: string | null;
      }[];

      const firstImage = deliverables.find((d) =>
        d.mime_type?.startsWith("image/")
      );
      let previewUrl: string | null = null;
      if (firstImage) {
        const { data } = await supabase.storage
          .from("deliverables")
          .createSignedUrl(firstImage.file_path, 3600);
        previewUrl = data?.signedUrl ?? null;
      }

      const list = reusedIn.get(r.id) ?? [];

      return {
        id: r.id,
        title: r.title,
        type: r.type,
        description: r.description,
        clientName: client?.name ?? "—",
        clientSlug: client?.slug ?? null,
        clientAccent: client?.accent_color || "#5B4BD6",
        approvedAt: r.updated_at,
        previewUrl,
        assignee: r.assignee_id ? assigneeNames.get(r.assignee_id) ?? null : null,
        fileCount: deliverables.length,
        totalSize: deliverables.reduce((sum, d) => sum + (d.file_size ?? 0), 0),
        reuseCount: list.length,
        reusedIn: list,
      };
    })
  );

  const stats: PlaybookStats = {
    deliveries: pieces.length,
    clients: new Set(
      done
        .map((r) => (r.clients as { name: string } | null)?.name)
        .filter(Boolean)
    ).size,
    reuses: (reuseRows ?? []).length,
  };

  // Active clients power the "reuse as brief" target picker.
  const { data: activeClientsData } = await supabase
    .from("clients")
    .select("id, name, accent_color")
    .eq("is_active", true)
    .order("name");

  const activeClients: PlaybookClient[] = (activeClientsData ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    accent: c.accent_color || "#5B4BD6",
  }));

  return (
    <PlaybookView pieces={pieces} stats={stats} activeClients={activeClients} />
  );
}
