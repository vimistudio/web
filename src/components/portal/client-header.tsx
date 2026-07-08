"use client";

import { useState, useEffect } from "react";
import { type User } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Notification03Icon, Logout01Icon, Settings02Icon, SearchIcon } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Profile } from "./portal-shell";
import { SearchCommand } from "./search-command";
import { NotificationDropdown } from "./notification-dropdown";
import { useLocale } from "./locale-provider";

interface ClientHeaderProps {
  user: User;
  profile: Profile;
  /** True when an admin is previewing this shell via impersonation. The
   *  notification bell is hidden because notifications are admin-owned and
   *  cross-client — showing them would make the client preview dishonest. */
  impersonating?: boolean;
}

export function ClientHeader({ user, profile, impersonating = false }: ClientHeaderProps) {
  const router = useRouter();
  const { t } = useLocale();
  const initials = (profile.full_name ?? user.email ?? "?")[0].toUpperCase();
  const [searchOpen, setSearchOpen] = useState(false);
  const clientLogo = profile.clients?.logo_url;
  const clientName = profile.clients?.name;

  // Cmd+K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/portal/login");
  };

  return (
    <>
      {/* Mobile: light compact header */}
      <header className="md:hidden sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-white/80 backdrop-blur-sm px-4">
        <Link href="/portal" className="flex items-center">
          {clientLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={clientLogo}
              alt={clientName ?? "Studio"}
              className="h-7 w-auto max-w-[150px] object-contain"
            />
          ) : (
            <Image
              src="/vimi-logo-dark.svg"
              alt="Vimi Studio"
              width={100}
              height={32}
              className="h-6 w-auto"
            />
          )}
        </Link>

        <div className="flex-1" />

        <button
          onClick={() => setSearchOpen(true)}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Search"
        >
          <SearchIcon size={18} />
        </button>

        {!impersonating && <NotificationDropdown variant="light" />}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary text-white text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white border shadow-lg">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{profile.full_name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/portal/profile")}>
              <Settings02Icon size={16} className="mr-2" />
              {t("header.settings")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <Logout01Icon size={16} className="mr-2" />
              {t("header.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Desktop: slim light header — search + bell + avatar. The client
          identity/logo now lives in the sidebar chip (see ClientSidebar), so
          it's intentionally not duplicated here. */}
      <header className="hidden md:flex items-center justify-between gap-4 bg-[var(--vimi-page)]/80 backdrop-blur-sm border-b border-[color:var(--vimi-border)] px-8 py-4 sticky top-0 z-40">
        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="bg-white border border-[color:var(--vimi-border)] rounded-full px-5 py-2.5 w-[400px] max-w-full text-left hover:border-[color:rgba(28,27,31,0.16)] transition-colors"
        >
          <span className="text-[color:var(--vimi-faint)] text-sm">
            {t("header.searchPlaceholder")}
          </span>
          <kbd className="text-[10px] text-[color:var(--vimi-faint)] float-right mt-0.5 border border-[color:var(--vimi-border)] rounded px-1.5 py-0.5">
            ⌘K
          </kbd>
        </button>
        <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />

        {/* Right: notification + avatar */}
        <div className="flex items-center gap-4">
          {!impersonating && <NotificationDropdown variant="light" />}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={profile.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-primary text-white text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border shadow-lg">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{profile.full_name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/portal/profile")}>
                <Settings02Icon size={16} className="mr-2" />
                {t("header.settings")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <Logout01Icon size={16} className="mr-2" />
                {t("header.signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}
