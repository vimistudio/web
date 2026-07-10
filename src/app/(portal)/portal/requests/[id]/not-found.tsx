"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { t, type Locale } from "@/lib/portal-i18n";

export default function RequestNotFound() {
  // Rendered outside the LocaleProvider — detect locale client-side, Spanish-first
  // (default ES, flip to EN only for English browsers).
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
      <h1 className="text-xl font-semibold mb-2">{t("detail.notFoundTitle", locale)}</h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        {t("detail.notFoundBody", locale)}
      </p>
      <Link href="/portal">
        <Button variant="outline">{t("detail.notFoundBack", locale)}</Button>
      </Link>
    </div>
  );
}
