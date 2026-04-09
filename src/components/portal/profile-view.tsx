"use client";

import { type User } from "@supabase/supabase-js";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Logout01Icon } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface ProfileViewProps {
  user: User;
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    role: "client" | "admin";
    client_id: string | null;
    created_at: string;
    clients: { name: string; slug: string } | null;
  };
}

export function ProfileView({ user, profile }: ProfileViewProps) {
  const router = useRouter();
  const isAdmin = profile.role === "admin";
  const initials = (profile.full_name ?? user.email ?? "?")[0].toUpperCase();
  const memberSince = new Date(profile.created_at).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/portal/login");
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Profile</h1>

      {/* User Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="bg-[#909af7] text-white text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold">
                {profile.full_name ?? "Unknown"}
              </h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className={
                    isAdmin
                      ? "bg-[#909af7]/10 text-[#909af7] border-[#909af7]/30"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }
                >
                  {isAdmin ? "Admin" : "Client"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {profile.clients && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Project</span>
              <span className="text-sm font-medium">
                {profile.clients.name}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Role</span>
            <span className="text-sm font-medium capitalize">
              {profile.role}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Member since</span>
            <span className="text-sm font-medium">{memberSince}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Sign-in method</span>
            <span className="text-sm font-medium">Google</span>
          </div>
        </CardContent>
      </Card>

      {/* About Vimi */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-3">
            <Image
              src="/logo-vimi.png"
              alt="Vimi Studio"
              width={24}
              height={24}
              className="h-5 w-auto"
            />
            <span className="text-sm font-medium">Vimi Studio</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Your design partner. Need help? Reach out at{" "}
            <a
              href="mailto:hello@vimistudio.com"
              className="text-[#909af7] hover:underline"
            >
              hello@vimistudio.com
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Button
        onClick={handleSignOut}
        variant="outline"
        className="w-full gap-2 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
      >
        <Logout01Icon size={16} />
        Sign out
      </Button>
    </div>
  );
}
