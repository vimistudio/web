"use client";

import { type User } from "@supabase/supabase-js";
import { AdminSidebar } from "./admin-sidebar";
import { ClientBottomTabs } from "./client-bottom-tabs";
import { ClientHeader } from "./client-header";
import { PortalHeader } from "./portal-header";
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { LocaleProvider } from "./locale-provider";
import { type Locale } from "@/lib/portal-i18n";

interface Client {
  id: string;
  name: string;
  slug: string;
  locale?: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "client" | "admin";
  client_id: string | null;
  locale?: string;
  clients: Client | null;
}

interface PortalShellProps {
  user: User;
  profile: Profile;
  children: React.ReactNode;
}

export function PortalShell({ user, profile, children }: PortalShellProps) {
  const isAdmin = profile.role === "admin";
  const locale = (profile.locale as Locale) || "en";

  if (isAdmin) {
    return (
      <LocaleProvider locale={locale}>
        <SidebarProvider>
          <AdminSidebar user={user} profile={profile} />
          <SidebarInset>
            <PortalHeader user={user} profile={profile} />
            <main className="flex-1 p-4 md:p-6">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </LocaleProvider>
    );
  }

  return (
    <LocaleProvider locale={locale}>
      <div className="min-h-dvh flex flex-col bg-[#FAF9F7]">
        <ClientHeader user={user} profile={profile} />
        <main className="flex-1 p-4 pb-24 md:pb-8 md:px-12">{children}</main>
        {/* Bottom tabs only on mobile */}
        <div className="md:hidden">
          <ClientBottomTabs />
        </div>
      </div>
    </LocaleProvider>
  );
}
