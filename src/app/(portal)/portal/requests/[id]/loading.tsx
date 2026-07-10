"use client";

import { useLocale } from "@/components/portal/locale-provider";

// v2 loading skeleton — mirrors the request-detail shell (top bar + header
// card + deliverables + action bar + chat) with shimmer placeholders. The
// shimmer sweep is a no-op under prefers-reduced-motion (see .vm-shimmer).
function Bar({ className = "" }: { className?: string }) {
  return <div className={`vm-shimmer rounded-md ${className}`} />;
}

export default function RequestDetailLoading() {
  const { t } = useLocale();

  return (
    <div
      className="mx-auto max-w-2xl space-y-6 pb-36 md:pb-6"
      aria-busy="true"
      aria-live="polite"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <Bar className="h-4 w-28" />
        <Bar className="h-4 w-40" />
      </div>

      {/* Header card */}
      <div className="rounded-[20px] border border-[color:var(--vimi-border)] bg-white p-6 shadow-[0_2px_8px_rgba(28,27,31,0.05)] sm:p-7">
        <div className="flex items-center gap-2">
          <Bar className="h-5 w-24" />
          <Bar className="h-5 w-20" />
        </div>
        <Bar className="mt-3 h-8 w-3/4" />
        <Bar className="mt-3 h-4 w-full" />
        <Bar className="mt-2 h-4 w-2/3" />

        <div className="my-5 h-px bg-[color:var(--vimi-border)]" />

        {/* Stepper placeholder — dots + connecting bars */}
        <div className="flex items-center gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-1 items-center gap-2">
              <div className="vm-shimmer h-8 w-8 shrink-0 rounded-full" />
              {i < 3 && <Bar className="h-[3px] flex-1" />}
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-2 text-sm text-[color:var(--vimi-muted)]">
          <span
            className="h-2.5 w-2.5 animate-pulse rounded-full"
            style={{ background: "var(--accent)" }}
          />
          {t("detail.loadingRequest")}
        </div>
      </div>

      {/* Deliverables grid */}
      <div className="space-y-3">
        <Bar className="h-5 w-32" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="vm-shimmer h-40 rounded-[18px]" />
          <div className="vm-shimmer h-40 rounded-[18px]" />
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="vm-shimmer h-14 flex-1 rounded-full" />
        <div className="vm-shimmer h-14 w-40 rounded-full" />
      </div>

      {/* Chat */}
      <div className="space-y-3">
        <Bar className="h-4 w-40" />
        {[0, 1].map((i) => (
          <div
            key={i}
            className={`flex items-end gap-2 ${i % 2 ? "flex-row-reverse" : ""}`}
          >
            <div className="vm-shimmer h-8 w-8 shrink-0 rounded-full" />
            <div className="vm-shimmer h-12 w-2/3 rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
