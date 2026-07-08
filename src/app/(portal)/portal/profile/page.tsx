import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileView } from "@/components/portal/profile-view";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/portal/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, clients!profiles_client_id_fkey(name, slug)")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/portal/login");

  return (
    <ProfileView
      user={user}
      profile={profile}
    />
  );
}
