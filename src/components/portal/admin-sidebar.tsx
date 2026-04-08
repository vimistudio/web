"use client";

import { type User } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardSquare01Icon } from "@/components/ui/icons";
import { UserGroupIcon } from "@/components/ui/icons";
import { PaintBoardIcon } from "@/components/ui/icons";
import { Settings02Icon } from "@/components/ui/icons";
import { Logout01Icon } from "@/components/ui/icons";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "./portal-shell";

const adminNavItems = [
  { title: "Dashboard", href: "/portal/admin", icon: DashboardSquare01Icon },
  { title: "Clients", href: "/portal/admin/clients", icon: UserGroupIcon },
  { title: "Playbook", href: "/portal/admin/playbook", icon: PaintBoardIcon },
  { title: "Settings", href: "/portal/admin/settings", icon: Settings02Icon },
];

interface AdminSidebarProps {
  user: User;
  profile: Profile;
}

export function AdminSidebar({ user, profile }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/portal/login");
  };

  const initials = (profile.full_name ?? user.email ?? "?")[0].toUpperCase();

  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="p-4">
        <Link href="/portal/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#909af7]/20 flex items-center justify-center">
            <span className="text-[#909af7] font-bold text-sm">V</span>
          </div>
          <span className="font-semibold text-sm">vimi studio</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname === item.href ||
                      (item.href !== "/portal/admin" &&
                        pathname.startsWith(item.href + "/"))
                    }
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut}>
              <Logout01Icon size={16} />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="bg-[#909af7] text-white text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {profile.full_name ?? user.email}
            </p>
            <p className="text-xs text-muted-foreground">Admin</p>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
