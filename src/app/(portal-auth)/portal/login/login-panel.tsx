"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LoginForm } from "@/components/portal/login-form";
import { t, type Locale } from "@/lib/portal-i18n";

interface LoginPanelProps {
  error?: string;
  next?: string;
}

/**
 * Pre-auth locale is unknown (no profile yet), so we detect it client-side from
 * navigator.language and default to English on the server. First paint is EN;
 * on hydration we switch to ES when the browser prefers Spanish. Kept as its own
 * client component so the rest of the login page stays a static server render.
 */
export function LoginPanel({ error, next }: LoginPanelProps) {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    if (
      typeof navigator !== "undefined" &&
      navigator.language?.toLowerCase().startsWith("es")
    ) {
      setLocale("es");
    }
  }, []);

  return (
    <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 space-y-8 shadow-2xl shadow-black/20">
      <div className="text-center space-y-2">
        <h1 className="text-xl font-semibold text-white tracking-tight">
          {t("login.welcome", locale)}
        </h1>
        <p className="text-sm text-[#6B6F99]">{t("login.subtitle", locale)}</p>
      </div>

      <LoginForm error={error} next={next} locale={locale} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/[0.06]" />
        </div>
      </div>

      <p className="text-center text-[11px] text-[#4a4d66] leading-relaxed">
        {t("login.inviteSetup", locale)}
        <br />
        {t("login.agree", locale)}{" "}
        <Link
          href="/terms"
          className="text-[#6B6F99] hover:text-[#909af7] cursor-pointer"
        >
          {t("login.terms", locale)}
        </Link>{" "}
        {t("login.and", locale)}{" "}
        <Link
          href="/privacy"
          className="text-[#6B6F99] hover:text-[#909af7] cursor-pointer"
        >
          {t("login.privacy", locale)}
        </Link>
        .
      </p>
    </div>
  );
}
