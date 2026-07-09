"use client";

import { useState, useEffect, useCallback } from "react";
import { type User } from "@supabase/supabase-js";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Logout01Icon, PlusSignIcon, Cancel01Icon } from "@/components/ui/icons";
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
      toast.error(t("profile.localeError"));
      return;
    }
    router.refresh();
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/portal/login");
  };

  // --- Client-side team invites ---
  const clientName = profile.clients?.name ?? "";
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [teamInvites, setTeamInvites] = useState<
    { email: string; created_at: string }[]
  >([]);
  const [members, setMembers] = useState<
    { id: string; full_name: string | null; avatar_url: string | null; email: string | null }[]
  >([]);

  const loadInvites = useCallback(async () => {
    if (isAdmin || !profile.client_id) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("invited_emails")
      .select("email, created_at")
      .eq("client_id", profile.client_id)
      .order("created_at", { ascending: false });
    setTeamInvites(data ?? []);
  }, [isAdmin, profile.client_id]);

  // Active members: same-client profiles (readable via RLS). Read-only here —
  // removing a member is an admin action.
  const loadMembers = useCallback(async () => {
    if (isAdmin || !profile.client_id) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, email")
      .eq("client_id", profile.client_id)
      .order("created_at", { ascending: true });
    setMembers(data ?? []);
  }, [isAdmin, profile.client_id]);

  useEffect(() => {
    loadInvites();
    loadMembers();
  }, [loadInvites, loadMembers]);

  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || isInviting || !profile.client_id) return;
    setInviteError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInviteError(t("team.errorInvalid"));
      return;
    }
    // Re-invite guard: someone already on the team can't be re-invited.
    if (members.some((m) => m.email?.toLowerCase() === email)) {
      setInviteError(t("team.alreadyMember"));
      return;
    }
    setIsInviting(true);
    const supabase = createClient();
    const { error } = await supabase.from("invited_emails").insert({
      email,
      client_id: profile.client_id,
      role: "client",
    });
    if (error) {
      // 23505 = duplicate; anything else (incl. RLS 42501 when the migration
      // hasn't been applied yet) degrades to a friendly "ask your studio".
      setInviteError(
        error.code === "23505" ? t("team.errorDuplicate") : t("team.errorPermission")
      );
      setIsInviting(false);
      return;
    }

    // Notify the invited teammate + admins (fire-and-forget).
    fetch("/api/portal/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "team_invite",
        invite_email: email,
        client_name: clientName || t("team.yourProject"),
      }),
    }).catch(() => {});

    toast.success(t("team.success"));
    setInviteEmail("");
    setIsInviting(false);
    loadInvites();
  };

  const handleRevoke = async (email: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("invited_emails")
      .delete()
      .eq("email", email);
    if (error) {
      toast.error(t("team.errorPermission"));
      return;
    }
    loadInvites();
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
              <AvatarFallback className="bg-primary text-white text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold">
                {profile.full_name ?? t("profile.unknown")}
              </h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className={
                    isAdmin
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }
                >
                  {isAdmin ? t("profile.admin") : t("profile.client")}
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
                    ? "border-primary bg-primary/5 text-primary"
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

      {/* Team invites — clients only */}
      {!isAdmin && profile.client_id && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold">{t("team.title")}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t("team.subtitle")}
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                type="email"
                inputMode="email"
                placeholder={t("team.emailPlaceholder")}
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  if (inviteError) setInviteError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                className="h-11"
              />
              <Button
                onClick={handleInvite}
                disabled={!inviteEmail.trim() || isInviting}
                className="h-11 gap-2 bg-primary hover:bg-primary/90 shrink-0"
              >
                <PlusSignIcon size={16} color="white" />
                {isInviting ? t("team.inviting") : t("team.invite")}
              </Button>
            </div>

            {inviteError && (
              <p className="text-sm text-red-500">{inviteError}</p>
            )}

            {members.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  {t("team.members")}
                </p>
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-lg border px-3 py-2"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={member.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-primary text-white text-xs">
                        {(member.full_name ?? member.email ?? "?")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {member.full_name ?? member.email ?? t("profile.unknown")}
                      </p>
                      {member.email && member.full_name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </p>
                      )}
                    </div>
                    {member.id === profile.id && (
                      <Badge
                        variant="outline"
                        className="shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        {t("team.you")}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}

            {teamInvites.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  {t("team.pending")}
                </p>
                {teamInvites.map((invite) => (
                  <div
                    key={invite.email}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{invite.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("team.invited")}{" "}
                        {new Date(invite.created_at).toLocaleDateString(
                          locale === "es" ? "es" : "en-US"
                        )}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          aria-label={t("team.revoke")}
                          title={t("team.revoke")}
                          className="flex items-center justify-center min-w-[44px] min-h-[44px] shrink-0 -mr-2 text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Cancel01Icon size={16} />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {t("team.revokeConfirmTitle")}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("team.revokeConfirmBody", { email: invite.email })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            {t("team.revokeKeep")}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRevoke(invite.email)}
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            {t("team.revokeConfirm")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
            <span className="text-sm font-medium">
              {isAdmin ? t("profile.admin") : t("profile.client")}
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
              className="text-primary hover:underline"
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
