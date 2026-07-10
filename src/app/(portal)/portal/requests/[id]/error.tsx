"use client";

import Link from "next/link";
import { useLocale } from "@/components/portal/locale-provider";
import { STUDIO_WHATSAPP_URL } from "@/lib/studio";

export default function RequestDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();
  const studio = t("detail.vimistudio");

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
      <h1 className="font-serif text-3xl italic leading-tight text-[color:var(--vimi-ink)]">
        {t("error.title")}
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[color:var(--vimi-muted)]">
        {t("error.body")}
      </p>
      <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={reset}
          className="inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-semibold text-[color:var(--accent-foreground)] transition-transform hover:-translate-y-0.5 active:scale-95"
          style={{ background: "var(--accent)" }}
        >
          {t("error.retry")}
        </button>
        <Link
          href="/portal"
          className="inline-flex h-12 items-center justify-center rounded-full border border-[color:var(--vimi-border)] bg-white px-6 text-sm font-semibold text-[color:var(--vimi-ink)] transition-colors hover:bg-[color:rgba(28,27,31,0.03)]"
        >
          {t("notFound.cta")}
        </Link>
        <a
          href={STUDIO_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 items-center justify-center rounded-full border border-[color:var(--vimi-border)] bg-white px-6 text-sm font-semibold text-[color:var(--vimi-ink)] transition-colors hover:bg-[color:rgba(28,27,31,0.03)]"
        >
          {t("notFound.contact", { studio })}
        </a>
      </div>
    </div>
  );
}
