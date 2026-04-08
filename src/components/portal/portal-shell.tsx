"use client";

import { type User } from "@supabase/supabase-js";
import { AdminSidebar } from "./admin-sidebar";
import { ClientBottomTabs } from "./client-bottom-tabs";
import { PortalHeader } from "./portal-header";
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";

interface Client {
  id: string;
  name: string;
  slug: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "client" | "admin";
  client_id: string | null;
  clients: Client | null;
}

interface PortalShellProps {
  user: User;
  profile: Profile;
  children: React.ReactNode;
}

export function PortalShell({ user, profile, children }: PortalShellProps) {
  const isAdmin = profile.role === "admin";

  if (isAdmin) {
    return (
      <SidebarProvider>
        <AdminSidebar user={user} profile={profile} />
        <SidebarInset>
          <PortalHeader user={user} profile={profile} />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfafa]">
      <PortalHeader user={user} profile={profile} />
      <main className="flex-1 p-4 pb-20">{children}</main>
      <ClientBottomTabs />
    </div>
  );
}
