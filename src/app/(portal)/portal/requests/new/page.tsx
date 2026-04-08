import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewRequestForm } from "@/components/portal/new-request-form";

export default async function NewRequestPage() {
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

  if (!profile?.client_id && profile?.role !== "admin") {
    redirect("/portal");
  }

  return <NewRequestForm clientId={profile.client_id!} userId={user.id} />;
}
