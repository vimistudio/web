"use client";

import { createContext, useContext } from "react";
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
