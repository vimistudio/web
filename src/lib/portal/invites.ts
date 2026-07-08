import type { createClient } from "@/lib/supabase/client";

type SupabaseBrowserClient = ReturnType<typeof createClient>;

export interface InviteOpResult {
  error: string | null;
  /** Profile was updated but the invite row couldn't be cleared. */
  partial?: boolean;
}

/**
 * Make a profile a client of a given project. Sets role=client + client_id.
 * Does NOT touch invited_emails — use for direct convert/move actions where
 * no invite row exists.
 */
export async function assignAsClient(
  supabase: SupabaseBrowserClient,
  params: { profileId?: string; email?: string; clientId: string }
): Promise<InviteOpResult> {
  const { profileId, email, clientId } = params;
  const q = supabase
    .from("profiles")
    .update({ role: "client" as const, client_id: clientId });
  const { error } = profileId
    ? await q.eq("id", profileId)
    : await q.eq("email", email ?? "");
  return { error: error?.message ?? null };
}

/**
 * Apply a pending invite to an existing profile: set role=client + client_id
 * from the invite, then delete the invite row so it can't linger. Shared by
 * the member-row hint, the settings pending-invite "Resolve" action, and the
 * admin dashboard self-banner.
 */
export async function applyInvite(
  supabase: SupabaseBrowserClient,
  params: { email: string; clientId: string; profileId?: string }
): Promise<InviteOpResult> {
  const assigned = await assignAsClient(supabase, params);
  if (assigned.error) return assigned;
  const { error: deleteError } = await supabase
    .from("invited_emails")
    .delete()
    .eq("email", params.email);
  if (deleteError) return { error: deleteError.message, partial: true };
  return { error: null };
}
