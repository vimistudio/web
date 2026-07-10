"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { t, type Locale } from "@/lib/portal-i18n";

export default function RequestDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Route error boundaries render outside the LocaleProvider, so detect locale
  // client-side. Spanish-first: default ES, flip to EN only for English browsers
  // — never leave a Spanish-first client staring at English on an error screen.
  const [locale, setLocale] = useState<Locale>("es");
  useEffect(() => {
    if (
      typeof navigator !== "undefined" &&
      navigator.language?.toLowerCase().startsWith("en")
    ) {
      setLocale("en");
    }
  }, []);

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-20 text-center px-4">
      <h1 className="text-xl font-semibold mb-2">{t("detail.errorTitle", locale)}</h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        {t("detail.errorBody", locale)}
      </p>
      <Button onClick={reset} variant="outline">
        {t("detail.errorRetry", locale)}
      </Button>
    </div>
  );
}
