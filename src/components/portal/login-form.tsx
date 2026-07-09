"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { t, type Locale } from "@/lib/portal-i18n";

interface LoginFormProps {
  error?: string;
  next?: string;
  locale?: Locale;
}

export function LoginForm({ error, next, locale = "en" }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const callbackUrl = next
      ? `${window.location.origin}/portal/auth/callback?next=${encodeURIComponent(next)}`
      : `${window.location.origin}/portal/auth/callback`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
      },
    });
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
          <p className="text-sm text-red-400">{t("login.error", locale)}</p>
        </div>
      )}
      <button
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="w-full h-12 flex items-center justify-center gap-3 bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.1] hover:border-white/[0.15] text-white rounded-xl font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {t("login.signingIn", locale)}
          </span>
        ) : (
          t("login.continueGoogle", locale)
        )}
      </button>
    </div>
  );
}
