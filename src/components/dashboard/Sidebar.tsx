"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Home, FolderOpen, Calendar, MessageSquare, FileImage, Users, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (isOpen && window.innerWidth < 1024) {
      onClose();
    }
  }, [pathname, isOpen, onClose]);

  const navItems = [
    { name: "Dashboard", href: "/portal", icon: <Home className="h-5 w-5" /> },
    { name: "Projects", href: "/portal/projects", icon: <FolderOpen className="h-5 w-5" /> },
    { name: "Calendar", href: "/portal/calendar", icon: <Calendar className="h-5 w-5" /> },
    { name: "Messages", href: "/portal/messages", icon: <MessageSquare className="h-5 w-5" /> },
    { name: "Files", href: "/portal/files", icon: <FileImage className="h-5 w-5" /> },
    { name: "Team", href: "/portal/team", icon: <Users className="h-5 w-5" /> },
    { name: "Settings", href: "/portal/settings", icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b lg:hidden">
          <span className="text-xl font-bold">Vimi Portal</span>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close sidebar">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md group",
                  pathname === item.href
                    ? "bg-primary-50 text-primary-600"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
