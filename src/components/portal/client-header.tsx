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

interface ClientHeaderProps {
  user: User;
  profile: Profile;
}

export function ClientHeader({ user, profile }: ClientHeaderProps) {
  const router = useRouter();
  const initials = (profile.full_name ?? user.email ?? "?")[0].toUpperCase();
  const [searchOpen, setSearchOpen] = useState(false);

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
          <Image
            src="/vimi-logo-dark.svg"
            alt="Vimi Studio"
            width={100}
            height={32}
            className="h-6 w-auto"
          />
        </Link>

        <div className="flex-1" />

        <button
          onClick={() => setSearchOpen(true)}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Search"
        >
          <SearchIcon size={18} />
        </button>

        <NotificationDropdown variant="light" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="bg-[#909af7] text-white text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{profile.full_name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/portal/profile")}>
              <Settings02Icon size={16} className="mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <Logout01Icon size={16} className="mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Desktop: dark header matching Paper design */}
      <header className="hidden md:flex items-center justify-between bg-[#0d0f1a] px-8 py-4">
        {/* Logo */}
        <Link href="/portal" className="flex items-center">
          <Image
            src="/vimi-logo-light.svg"
            alt="Vimi Studio"
            width={140}
            height={45}
            className="h-8 w-auto"
          />
        </Link>

        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="bg-[#1a1d2e] rounded-lg px-5 py-2.5 w-[400px] text-left hover:bg-[#1e2136] transition-colors"
        >
          <span className="text-[#4a4d66] text-sm">
            Search projects, files, documents...
          </span>
          <kbd className="text-[10px] text-[#4a4d66] float-right mt-0.5 border border-[#2a2d46] rounded px-1.5 py-0.5">
            ⌘K
          </kbd>
        </button>
        <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />

        {/* Right: notification + avatar */}
        <div className="flex items-center gap-4">
          <NotificationDropdown variant="dark" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-[#909af7]/50">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={profile.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-[#909af7] text-white text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{profile.full_name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/portal/profile")}>
                <Settings02Icon size={16} className="mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <Logout01Icon size={16} className="mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}
