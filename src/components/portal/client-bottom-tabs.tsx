"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { GridViewIcon } from "@/components/ui/icons";
import { Image01Icon } from "@/components/ui/icons";
import { UserCircleIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

const clientTabs = [
  { title: "Board", href: "/portal", icon: GridViewIcon },
  { title: "Gallery", href: "/portal/gallery", icon: Image01Icon },
  { title: "Profile", href: "/portal/profile", icon: UserCircleIcon },
];

export function ClientBottomTabs() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe">
      <div className="flex items-center justify-around h-16">
        {clientTabs.map((tab) => {
          const isActive =
            tab.href === "/portal"
              ? pathname === "/portal"
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 text-xs transition-colors",
                isActive
                  ? "text-[#909af7]"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <tab.icon size={20} />
              <span>{tab.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
