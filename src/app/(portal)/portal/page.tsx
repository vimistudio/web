import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ClientBoard } from "@/components/portal/client-board";
import { SetLastVisited } from "@/components/portal/set-last-visited";

export default async function PortalPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/portal/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, client_id, clients(id, name, slug)")
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
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-[#909af7]/10 flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#909af7]">
            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="text-2xl font-semibold mb-2">Almost there!</h1>
        <p className="text-muted-foreground max-w-md mb-6">
          Your account hasn&apos;t been linked to a project yet.
          We&apos;re getting it set up for you — check back soon.
        </p>
        <a
          href="mailto:hello@vimistudio.com"
          className="text-sm text-[#909af7] hover:text-[#7b85e8] font-medium transition-colors"
        >
          Questions? Reach out at hello@vimistudio.com
        </a>
      </div>
    );
  }

  // Fetch client name
  const { data: client } = await supabase
    .from("clients")
    .select("name")
    .eq("id", clientId)
    .single();

  // Fetch requests for this client
  const { data: requests } = await supabase
    .from("requests")
    .select("*, deliverables(id, file_path, mime_type), comments(id)")
    .eq("client_id", clientId)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

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
        clientName={clientName}
        requests={requestsWithPreviews}
        requestCount={requestsWithPreviews.filter((r) => r.status !== "done").length}
        isAdmin={isImpersonating}
        lastVisitedAt={lastVisitedAt}
      />
    </>
  );
}
