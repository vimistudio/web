"use client";

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
import { Notification03Icon, Logout01Icon, Settings02Icon } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Profile } from "./portal-shell";

interface ClientHeaderProps {
  user: User;
  profile: Profile;
}

export function ClientHeader({ user, profile }: ClientHeaderProps) {
  const router = useRouter();
  const initials = (profile.full_name ?? user.email ?? "?")[0].toUpperCase();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/portal/login");
  };

  return (
    <>
      {/* Mobile: light compact header */}
      <header className="md:hidden sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-white/80 backdrop-blur-sm px-4">
        <Link href="/portal" className="flex items-center gap-2">
          <Image
            src="/logo-vimi.png"
            alt="Vimi Studio"
            width={28}
            height={28}
            className="h-6 w-auto"
          />
          <span className="font-semibold text-sm">vimi</span>
        </Link>

        <div className="flex-1" />

        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <Notification03Icon size={20} />
        </button>

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
        <Link href="/portal" className="flex items-center gap-3">
          <Image
            src="/logo-vimi.png"
            alt="Vimi Studio"
            width={32}
            height={32}
            className="h-8 w-auto"
          />
          <div className="flex flex-col leading-tight">
            <span className="text-[#C8CCFF] text-base font-bold tracking-tight">
              vimi
            </span>
            <span className="text-[#6B6F99] text-[10px] font-medium tracking-widest">
              studio
            </span>
          </div>
        </Link>

        {/* Search */}
        <div className="bg-[#1a1d2e] rounded-lg px-5 py-2.5 w-[400px]">
          <span className="text-[#4a4d66] text-sm">
            Search projects, files, documents...
          </span>
        </div>

        {/* Right: notification + avatar */}
        <div className="flex items-center gap-4">
          <button className="text-[#4a4d66] hover:text-[#6B6F99] transition-colors">
            <Notification03Icon size={20} />
          </button>

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
