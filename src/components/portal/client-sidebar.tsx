"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "./locale-provider";
import { type PortalKey } from "@/lib/portal-i18n";
import {
  STUDIO_WHATSAPP_URL,
  isStudioNoteFresh,
  studioNoteFreshness,
} from "@/lib/studio";
import type { Profile, StudioDesigner } from "./portal-shell";

const navItems: { titleKey: PortalKey; href: string }[] = [
  { titleKey: "tab.board", href: "/portal" },
  { titleKey: "tab.gallery", href: "/portal/gallery" },
  { titleKey: "tab.agreement", href: "/portal/agreement" },
  { titleKey: "tab.profile", href: "/portal/profile" },
];

/**
 * Desktop-only client sidebar (hidden below md). Mirrors the admin sidebar's
 * width, paddings and border tokens so both shells feel like one product.
 * Client identity chip on top, soft-pill nav in the middle, studio contact
 * card pinned to the bottom.
 */
export function ClientSidebar({
  profile,
  designer,
}: {
  profile: Profile;
  designer?: StudioDesigner | null;
}) {
  const pathname = usePathname();
  const { t, locale } = useLocale();

  const client = profile.clients;
  const clientName = client?.name ?? "";
  const clientLogo = client?.logo_url;
  // Admin-authored, per-client. Only shown while fresh (≤14d) — a stale
  // presence note erodes trust more than showing nothing.
  const studioNote = client?.studio_note?.trim();
  const noteFresh = isStudioNoteFresh(studioNote, client?.studio_note_updated_at);
  const noteAge = noteFresh
    ? studioNoteFreshness(client?.studio_note_updated_at, locale)
    : null;

  const isActive = (href: string) =>
    href === "/portal"
      ? pathname === "/portal" || pathname.startsWith("/portal/requests")
      : pathname.startsWith(href);

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col gap-1.5 border-r border-[color:var(--vimi-border)] bg-[var(--vimi-page)] px-4 py-5 md:sticky md:top-0 md:h-dvh overflow-y-auto">
      {/* Client identity chip */}
      <Link
        href="/portal"
        className="flex items-center gap-2.5 rounded-xl border border-[color:var(--vimi-border)] bg-white px-3 py-2.5 mb-3 min-h-[44px]"
      >
        {clientLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={clientLogo}
            alt={clientName}
            className="h-6 w-auto max-w-[150px] object-contain"
          />
        ) : (
          <>
            <span
              className="w-2.5 h-2.5 rounded-[4px] shrink-0"
              style={{ background: "var(--accent)" }}
            />
            <span className="text-sm font-bold tracking-[-0.01em] truncate text-[color:var(--vimi-ink)]">
              {clientName}
            </span>
          </>
        )}
      </Link>

      {/* Nav pills — soft active treatment (light pill + accent dot) */}
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-full min-h-[44px] px-3 text-sm font-semibold transition-colors ${
              active
                ? "bg-[color:rgba(28,27,31,0.06)] text-[color:var(--vimi-ink)]"
                : "text-[color:var(--vimi-muted)] hover:bg-[color:rgba(28,27,31,0.06)] hover:text-[color:var(--vimi-ink)]"
            }`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: active ? "var(--accent)" : "transparent" }}
            />
            {t(item.titleKey)}
          </Link>
        );
      })}

      {/* Studio contact card — shows the assigned designer when set, else a
          generic studio card. */}
      <div className="mt-auto flex flex-col gap-2.5 rounded-2xl border border-[color:var(--vimi-border)] bg-white p-3.5">
        <div className="flex items-center gap-2.5">
          {designer?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={designer.avatar_url}
              alt={designer.full_name ?? "Vimi Studio"}
              className="w-8 h-8 rounded-full object-cover shrink-0"
            />
          ) : (
            <span className="w-8 h-8 rounded-full bg-[#5B4BD6] text-white flex items-center justify-center font-bold text-xs shrink-0">
              {designer?.full_name?.charAt(0).toUpperCase() || "V"}
            </span>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-[12.5px] font-bold truncate text-[color:var(--vimi-ink)]">
              {designer?.full_name || "Vimi Studio"}
            </span>
            {designer && (
              <span className="text-[11.5px] text-[color:var(--vimi-muted)]">
                Vimi Studio
              </span>
            )}
          </div>
        </div>
        {noteFresh && studioNote && (
          <div className="flex flex-col gap-1">
            <p className="font-serif italic text-xs leading-relaxed text-[color:var(--vimi-muted)]">
              &ldquo;{studioNote}&rdquo;
            </p>
            {noteAge && (
              <span className="text-[10.5px] text-[color:var(--vimi-faint)]">
                {noteAge}
              </span>
            )}
          </div>
        )}
        <a
          href={STUDIO_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-full bg-[#1FAF5A] px-3 py-2.5 text-[12.5px] font-bold text-white min-h-[44px] transition-opacity hover:opacity-90"
        >
          {t("studio.whatsapp")}
        </a>
      </div>
    </aside>
  );
}
