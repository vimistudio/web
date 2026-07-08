import type { SupabaseClient } from "@supabase/supabase-js";

/** A studio person serving a client, resolved (client_team row + admin profile). */
export interface ClientTeamMember {
  /** client_team row id */
  id: string;
  profileId: string;
  fullName: string | null;
  avatarUrl: string | null;
  /** Free studio text, shown to the client verbatim. */
  roleLabel: string | null;
  isLead: boolean;
}

/**
 * Fetch a client's studio crew, lead first. JS-joins profiles (never embeds
 * across client_team — see 20260717_client_team.sql FK-safety note).
 *
 * Tolerates the client_team table not existing yet (pre-migration) → returns []
 * so every caller degrades to the legacy single-designer behaviour.
 */
export async function fetchClientTeam(
  supabase: SupabaseClient,
  clientId: string
): Promise<ClientTeamMember[]> {
  const { data: rows, error } = await supabase
    .from("client_team")
    .select("id, profile_id, role_label, is_lead")
    .eq("client_id", clientId);

  if (error || !rows || rows.length === 0) return [];

  const profileIds = rows.map((r) => r.profile_id as string);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", profileIds);

  const byId = new Map(
    (profiles ?? []).map((p) => [p.id as string, p as { full_name: string | null; avatar_url: string | null }])
  );

  return rows
    .map((r) => {
      const p = byId.get(r.profile_id as string);
      return {
        id: r.id as string,
        profileId: r.profile_id as string,
        fullName: p?.full_name ?? null,
        avatarUrl: p?.avatar_url ?? null,
        roleLabel: (r.role_label as string | null) ?? null,
        isLead: Boolean(r.is_lead),
      };
    })
    .sort((a, b) => Number(b.isLead) - Number(a.isLead));
}
