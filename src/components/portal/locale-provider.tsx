"use client";

import { createContext, useContext, useEffect } from "react";
import { type Locale, type PortalKey, t as translate } from "@/lib/portal-i18n";

interface LocaleContextValue {
  locale: Locale;
  t: (key: PortalKey, vars?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  t: (key, vars) => translate(key, "en", vars),
});

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  // Keep <html lang> in sync with the resolved portal locale. The root layout
  // renders lang="en" statically; the effective language is only known per-user
  // once this provider mounts (e.g. Spanish for SCARTS), so update it here.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value: LocaleContextValue = {
    locale,
    t: (key, vars) => translate(key, locale, vars),
  };

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
