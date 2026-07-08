import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AgreementView } from "@/components/portal/agreement-view";
import { computeEngagementMonth } from "@/lib/agreement";
import { type Locale } from "@/lib/portal-i18n";

export default async function AgreementPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/portal/login");

  // Same auth/impersonation preamble as /portal (FK-hinted clients embed avoids
  // PostgREST ambiguity — see Decisions/2026-04-13-postgrest-fk-ambiguity-incident).
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, client_id, locale, full_name, clients!profiles_client_id_fkey(id, name, slug, locale)")
    .eq("id", user.id)
    .single();

  const cookieStore = cookies();
  const impersonateClientId = cookieStore.get("impersonate_client")?.value;
  const isImpersonating = profile?.role === "admin" && !!impersonateClientId;

  // Non-impersonating admins belong on the admin dashboard, not the client hub.
  if (profile?.role === "admin" && !isImpersonating) {
    redirect("/portal/admin");
  }

  const clientId = isImpersonating ? impersonateClientId : profile?.client_id;
  if (!clientId) redirect("/portal");

  // "*" (not an explicit column list) tolerates engagement_started_at not
  // existing yet — the page degrades gracefully before the migration is applied.
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  // Tolerate the client_documents table not existing yet → empty grid, nav works.
  const { data: docsRaw, error: docsError } = await supabase
    .from("client_documents")
    .select(
      "id, kind, title, description, status_label, file_path, file_name, file_size, mime_type, sort"
    )
    .eq("client_id", clientId)
    .order("sort", { ascending: true })
    .order("created_at", { ascending: true });

  const documents = docsError ? [] : docsRaw ?? [];

  // Sign each stored doc so the client can preview/download it (client SELECT
  // storage policy gates this). Placeholders (null file_path) get no URL.
  const docsWithUrls = await Promise.all(
    documents.map(async (d) => {
      if (!d.file_path) return { ...d, signedUrl: null };
      const { data } = await supabase.storage
        .from("client-docs")
        .createSignedUrl(d.file_path, 3600);
      return { ...d, signedUrl: data?.signedUrl ?? null };
    })
  );

  const designerId = (client as { designer_id?: string | null } | null)?.designer_id;
  const { data: designer } = designerId
    ? await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", designerId)
        .maybeSingle()
    : { data: null };

  // Same-client members (RLS "Users can view scoped profiles" allows this).
  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("client_id", clientId)
    .eq("role", "client");

  const engagementStartedAt =
    (client as { engagement_started_at?: string | null } | null)?.engagement_started_at ?? null;
  const month = computeEngagementMonth(engagementStartedAt);
  const locale =
    (client?.locale as Locale) ||
    (profile?.locale as Locale) ||
    "en";

  // Localized month-chip label ("JULIO 2026") + engagement start date, computed
  // server-side to keep the client view purely presentational (no hydration drift).
  const intlLocale = locale === "es" ? "es-ES" : "en-US";
  const monthYear = new Date()
    .toLocaleDateString(intlLocale, { month: "long", year: "numeric" })
    .toUpperCase();
  const sinceDate = engagementStartedAt
    ? new Date(`${engagementStartedAt}T00:00:00`).toLocaleDateString(intlLocale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <AgreementView
      companyName={client?.name ?? "Your Project"}
      retainerAmount={client?.retainer_amount ?? null}
      dealTerms={client?.deal_terms ?? null}
      month={month}
      monthYear={monthYear}
      sinceDate={sinceDate}
      docs={docsWithUrls}
      designer={designer ?? null}
      members={members ?? []}
      isImpersonatingAdmin={isImpersonating}
    />
  );
}
