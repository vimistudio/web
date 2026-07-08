import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ClientBoard } from "@/components/portal/client-board";
import { type Milestone } from "@/components/portal/plan-tracker";
import { SetLastVisited } from "@/components/portal/set-last-visited";
import { t, type Locale } from "@/lib/portal-i18n";

export default async function PortalPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/portal/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, client_id, locale, full_name, clients!profiles_client_id_fkey(id, name, slug, locale)")
    .eq("id", user.id)
    .single();

  // Read cookies
  const cookieStore = cookies();
  const impersonateClientId = cookieStore.get("impersonate_client")?.value;
  const lastVisitedAt = cookieStore.get("portal_last_visited")?.value || null;
  const isImpersonating = profile?.role === "admin" && !!impersonateClientId;

  // Only redirect admins to dashboard if NOT impersonating
  if (profile?.role === "admin" && !isImpersonating) {
    redirect("/portal/admin");
  }

  // Determine which client ID to use
  const clientId = isImpersonating ? impersonateClientId : profile?.client_id;

  if (!clientId) {
    const gateLocale =
      (profile?.locale as Locale) ||
      ((profile?.clients as { locale?: string } | null)?.locale as Locale) ||
      "en";
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary">
            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="text-2xl font-semibold mb-2">{t("gate.almost.title", gateLocale)}</h1>
        <p className="text-muted-foreground max-w-md mb-6">
          {t("gate.almost.body", gateLocale)}
        </p>
        <a
          href="mailto:hello@vimistudio.com"
          className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
        >
          {t("gate.almost.contact", gateLocale)}
        </a>
      </div>
    );
  }

  // Fetch client name
  const { data: client } = await supabase
    .from("clients")
    .select(
      "name, retainer_amount, deal_terms, logo_url, studio_note, studio_note_updated_at, designer_id"
    )
    .eq("id", clientId)
    .single();

  // Resolve the assigned designer for the mobile studio strip (clients may read
  // admin profiles — RLS policy from 20260413_allow_clients_to_read_admin_profiles).
  const { data: designer } = client?.designer_id
    ? await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", client.designer_id)
        .maybeSingle()
    : { data: null };

  // Fetch requests for this client
  const { data: requests } = await supabase
    .from("requests")
    .select("*, deliverables(id, file_path, mime_type), comments(id)")
    .eq("client_id", clientId)
    .eq("is_archived", false)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  // Fetch this client's plan milestones (feature is invisible when empty)
  const { data: milestones } = await supabase
    .from("client_milestones")
    .select(
      "id, track, week, title, description, status, needs_client, client_done, request_id, sort, delay_note"
    )
    .eq("client_id", clientId)
    .order("week", { ascending: true })
    .order("sort", { ascending: true });

  const clientName = client?.name ?? "Your Project";

  // Generate preview URLs for the first image deliverable of each request
  const requestsWithPreviews = await Promise.all(
    (requests ?? []).map(async (r) => {
      const firstImage = r.deliverables?.find(
        (d: { mime_type: string | null }) => d.mime_type?.startsWith("image/")
      );
      if (firstImage && (r.status === "review" || r.status === "done")) {
        const { data } = await supabase.storage
          .from("deliverables")
          .createSignedUrl(firstImage.file_path, 3600);
        return { ...r, previewUrl: data?.signedUrl ?? null };
      }
      return { ...r, previewUrl: null };
    })
  );

  return (
    <>
      <SetLastVisited />
      <ClientBoard
        clientId={clientId}
        clientName={clientName}
        clientLogoUrl={client?.logo_url ?? null}
        firstName={(profile?.full_name ?? "").trim().split(/\s+/)[0] || null}
        requests={requestsWithPreviews}
        requestCount={requestsWithPreviews.filter((r) => r.status !== "done").length}
        isAdmin={isImpersonating}
        lastVisitedAt={lastVisitedAt}
        milestones={(milestones ?? []) as Milestone[]}
        retainerAmount={client?.retainer_amount ?? null}
        dealTerms={client?.deal_terms ?? null}
        studioNote={client?.studio_note ?? null}
        studioNoteUpdatedAt={client?.studio_note_updated_at ?? null}
        designer={designer ?? null}
      />
    </>
  );
}
