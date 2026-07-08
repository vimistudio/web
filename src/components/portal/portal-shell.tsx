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
  logo_url?: string | null;
  accent_color?: string | null;
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
  /** Admin previewing the client shell via impersonation. Suppresses
   *  admin-owned surfaces (e.g. the notification bell) inside the preview. */
  impersonating?: boolean;
}

export function PortalShell({
  user,
  profile,
  children,
  impersonating = false,
}: PortalShellProps) {
  const isAdmin = profile.role === "admin";
  // Fall back to the client's configured locale when the user hasn't made an
  // explicit language choice, so an invited client sees their studio's default
  // language (e.g. Spanish for SCARTS) before touching profile settings.
  const locale =
    (profile.locale as Locale) ||
    (profile.clients?.locale as Locale) ||
    "en";

  // Per-client accent: injected as the --accent CSS variable so the whole
  // portal shell (buttons, dots, progress, avatars) takes on the client's
  // brand. Falls back to the globals.css default (#5B4BD6) when the client has
  // no accent_color set, or when the column is absent (reads as undefined).
  const accentStyle = profile.clients?.accent_color
    ? ({ "--accent": profile.clients.accent_color } as React.CSSProperties)
    : undefined;

  if (isAdmin) {
    return (
      <LocaleProvider locale={locale}>
        <SidebarProvider>
          <AdminSidebar user={user} profile={profile} />
          <SidebarInset className="font-sans">
            <PortalHeader user={user} profile={profile} />
            <main className="flex-1 p-4 md:p-6">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </LocaleProvider>
    );
  }

  return (
    <LocaleProvider locale={locale}>
      <div
        className="min-h-dvh flex flex-col bg-[var(--vimi-page)] font-sans text-[color:var(--vimi-ink)]"
        style={accentStyle}
      >
        <ClientHeader user={user} profile={profile} impersonating={impersonating} />
        <main className="flex-1 p-4 pb-24 md:pb-8 md:px-12">{children}</main>
        {/* Bottom tabs only on mobile */}
        <div className="md:hidden">
          <ClientBottomTabs />
        </div>
      </div>
    </LocaleProvider>
  );
}
