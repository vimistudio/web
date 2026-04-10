"use client";

import { useState } from "react";
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
import { useLocale } from "./locale-provider";
import { type Locale } from "@/lib/portal-i18n";
import { toast } from "sonner";

interface ProfileViewProps {
  user: User;
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    role: "client" | "admin";
    client_id: string | null;
    locale?: string;
    created_at: string;
    clients: { name: string; slug: string } | null;
  };
}

const LOCALE_OPTIONS: { value: Locale; label: string; flag: string }[] = [
  { value: "en", label: "English", flag: "EN" },
  { value: "es", label: "Español", flag: "ES" },
];

export function ProfileView({ user, profile }: ProfileViewProps) {
  const router = useRouter();
  const { t, locale } = useLocale();
  const isAdmin = profile.role === "admin";
  const initials = (profile.full_name ?? user.email ?? "?")[0].toUpperCase();
  const [currentLocale, setCurrentLocale] = useState<Locale>(locale);
  const [isSavingLocale, setIsSavingLocale] = useState(false);
  const memberSince = new Date(profile.created_at).toLocaleDateString(
    locale === "es" ? "es" : "en-US",
    { month: "long", year: "numeric" }
  );

  const handleLocaleChange = async (newLocale: Locale) => {
    if (newLocale === currentLocale) return;
    setIsSavingLocale(true);
    setCurrentLocale(newLocale);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ locale: newLocale })
      .eq("id", profile.id);
    setIsSavingLocale(false);
    if (error) {
      setCurrentLocale(locale);
      toast.error("Could not update language");
      return;
    }
    router.refresh();
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/portal/login");
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">{t("tab.profile")}</h1>

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

      {/* Language Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">{locale === "es" ? "Idioma" : "Language"}</span>
            {isSavingLocale && (
              <span className="text-xs text-muted-foreground animate-pulse">
                {locale === "es" ? "Guardando..." : "Saving..."}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {LOCALE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleLocaleChange(opt.value)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm font-medium ${
                  currentLocale === opt.value
                    ? "border-[#909af7] bg-[#909af7]/5 text-[#909af7]"
                    : "border-gray-200 text-muted-foreground hover:border-gray-300"
                }`}
              >
                <span className="text-xs font-bold opacity-60">{opt.flag}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {profile.clients && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("profile.project")}</span>
              <span className="text-sm font-medium">
                {profile.clients.name}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("profile.role")}</span>
            <span className="text-sm font-medium capitalize">
              {profile.role}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("profile.memberSince")}</span>
            <span className="text-sm font-medium">{memberSince}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("profile.signInMethod")}</span>
            <span className="text-sm font-medium">Google</span>
          </div>
        </CardContent>
      </Card>

      {/* About Vimi */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-3">
            <Image
              src="/vimi-logo-dark.svg"
              alt="Vimi Studio"
              width={100}
              height={32}
              className="h-5 w-auto"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {t("profile.about")}{" "}
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
        {t("profile.signOut")}
      </Button>
    </div>
  );
}
