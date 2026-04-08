"use client";

import Link from "next/link";
import { type User } from "@supabase/supabase-js";
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
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Notification03Icon } from "@/components/ui/icons";
import { Logout01Icon } from "@/components/ui/icons";
import { Settings02Icon } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Profile } from "./portal-shell";

interface PortalHeaderProps {
  user: User;
  profile: Profile;
}

export function PortalHeader({ user, profile }: PortalHeaderProps) {
  const router = useRouter();
  const isAdmin = profile.role === "admin";
  const initials = (profile.full_name ?? user.email ?? "?")[0].toUpperCase();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/portal/login");
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-white/80 backdrop-blur-sm px-4 md:px-6">
      {isAdmin && <SidebarTrigger />}

      {!isAdmin && (
        <Link href="/portal" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#909af7]/20 flex items-center justify-center">
            <span className="text-[#909af7] font-bold text-xs">V</span>
          </div>
          <span className="font-semibold text-sm">vimi</span>
        </Link>
      )}

      <div className="flex-1" />

      <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
        <Notification03Icon size={20} />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
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
  );
}
