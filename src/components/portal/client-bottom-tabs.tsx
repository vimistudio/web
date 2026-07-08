"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { GridViewIcon } from "@/components/ui/icons";
import { Image01Icon } from "@/components/ui/icons";
import { File01Icon } from "@/components/ui/icons";
import { UserCircleIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { useLocale } from "./locale-provider";
import { type PortalKey } from "@/lib/portal-i18n";

const clientTabs: { titleKey: PortalKey; href: string; icon: typeof GridViewIcon }[] = [
  { titleKey: "tab.board", href: "/portal", icon: GridViewIcon },
  { titleKey: "tab.gallery", href: "/portal/gallery", icon: Image01Icon },
  { titleKey: "tab.agreement", href: "/portal/agreement", icon: File01Icon },
  { titleKey: "tab.profile", href: "/portal/profile", icon: UserCircleIcon },
];

export function ClientBottomTabs() {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {clientTabs.map((tab) => {
          const isActive =
            tab.href === "/portal"
              ? pathname === "/portal" || pathname.startsWith("/portal/requests")
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <tab.icon size={20} />
              <span>{t(tab.titleKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
