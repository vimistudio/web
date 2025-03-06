"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Menu, Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar = ({ toggleSidebar }: NavbarProps) => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/portal/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="bg-white border-b sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 h-16">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-2"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/portal" className="flex items-center">
            <span className="text-xl font-bold">Vimi Portal</span>
          </Link>
        </div>

        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <form onSubmit={handleSearch} className="w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="User menu">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary-400 text-white">
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/portal/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/portal/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
