import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewRequestForm } from "@/components/portal/new-request-form";

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: { client?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/portal/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, client_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/portal");

  // Check impersonation cookie
  const cookieStore = cookies();
  const impersonateClientId = cookieStore.get("impersonate_client")?.value;

  // Admin creating for a specific client via ?client=<id> or impersonation
  const clientId = profile.role === "admin"
    ? searchParams.client || impersonateClientId || null
    : profile.client_id;

  if (!clientId) {
    redirect("/portal");
  }

  // If admin, fetch client name for context
  let clientName: string | undefined;
  if (profile.role === "admin" && searchParams.client) {
    const { data: client } = await supabase
      .from("clients")
      .select("name")
      .eq("id", searchParams.client)
      .single();
    clientName = client?.name ?? undefined;
  }

  // Jakob's Law: surface this client's recent briefs so a follow-up request
  // starts from something familiar. Most recent first, archived excluded,
  // de-duplicated by title, capped at 3.
  const { data: recent } = await supabase
    .from("requests")
    .select("title, type, created_at")
    .eq("client_id", clientId)
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(12);

  const seen = new Set<string>();
  const pastRequests = (recent ?? [])
    .filter((r) => {
      const key = r.title.trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3)
    .map((r) => ({ title: r.title, type: r.type }));

  return (
    <NewRequestForm
      clientId={clientId}
      userId={user.id}
      clientName={clientName}
      isAdmin={profile.role === "admin"}
      pastRequests={pastRequests}
    />
  );
}
