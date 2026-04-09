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

  // Admin creating for a specific client via ?client=<id>
  const clientId = profile.role === "admin" && searchParams.client
    ? searchParams.client
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

  return (
    <NewRequestForm
      clientId={clientId}
      userId={user.id}
      clientName={clientName}
      isAdmin={profile.role === "admin"}
    />
  );
}
