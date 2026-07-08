"use client";

import Image from "next/image";
import { type User } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardSquare01Icon } from "@/components/ui/icons";
import { Task01Icon } from "@/components/ui/icons";
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
  { title: "Queue", href: "/portal/admin/queue", icon: Task01Icon },
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

  const navButtonClass =
    "rounded-full min-h-[44px] px-3 text-[color:var(--vimi-muted)] hover:bg-[color:rgba(28,27,31,0.06)] hover:text-[color:var(--vimi-ink)] data-[active=true]:bg-[color:var(--vimi-ink)] data-[active=true]:text-[var(--vimi-page)] data-[active=true]:hover:bg-[color:var(--vimi-ink)] data-[active=true]:hover:text-[var(--vimi-page)]";

  return (
    <Sidebar className="border-r border-[color:var(--vimi-border)]">
      <SidebarHeader className="p-4">
        <Link href="/portal/admin" className="flex items-center">
          <Image
            src="/vimi-logo-dark.svg"
            alt="Vimi Studio"
            width={120}
            height={39}
            className="h-7 w-auto"
          />
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
                    className={navButtonClass}
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
            <SidebarMenuButton
              onClick={handleSignOut}
              className="rounded-full min-h-[44px] px-3 text-[color:var(--vimi-muted)] hover:bg-[color:rgba(28,27,31,0.06)] hover:text-[color:var(--vimi-ink)]"
            >
              <Logout01Icon size={16} />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary text-white text-xs">
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
