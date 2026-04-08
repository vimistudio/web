import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ClientBoard } from "@/components/portal/client-board";

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

  if (profile?.role === "admin") {
    redirect("/portal/admin");
  }

  if (!profile?.client_id) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <h1 className="text-2xl font-semibold mb-2">Welcome to Vimi Studio</h1>
        <p className="text-muted-foreground max-w-md">
          Your account hasn&apos;t been linked to a project yet. Carlos will set
          this up for you shortly.
        </p>
      </div>
    );
  }

  // Fetch requests for this client
  const { data: requests } = await supabase
    .from("requests")
    .select("*, deliverables(id, file_path, mime_type), comments(id)")
    .eq("client_id", profile.client_id)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  const clientName = (profile.clients as { name: string } | null)?.name ?? "Your Project";

  return (
    <ClientBoard
      clientName={clientName}
      requests={requests ?? []}
      requestCount={(requests ?? []).filter((r) => r.status !== "done").length}
    />
  );
}
