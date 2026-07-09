"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "./locale-provider";
import { Cancel01Icon, Notification03Icon, ArrowRight01Icon } from "@/components/ui/icons";
import { type PortalKey } from "@/lib/portal-i18n";

interface WelcomeOverlayProps {
  clientId: string;
  clientName: string;
  clientLogoUrl?: string | null;
  hasMilestones: boolean;
  /** Closes the overlay and scrolls the board to the plan tracker. */
  onSeePlan: () => void;
}

const TOTAL_STEPS = 3;

// The 4 board columns, in flow order, mapped to the shared status labels/colors.
const flowColumns: { labelKey: PortalKey; color: string }[] = [
  { labelKey: "status.queued", color: "var(--status-queued)" },
  { labelKey: "status.in_progress", color: "var(--status-progress)" },
  { labelKey: "status.review", color: "var(--status-review)" },
  { labelKey: "status.done", color: "var(--status-done)" },
];

export function WelcomeOverlay({
  clientId,
  clientName,
  clientLogoUrl,
  hasMilestones,
  onSeePlan,
}: WelcomeOverlayProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0); // 0-indexed
  const dialogRef = useRef<HTMLDivElement>(null);
  const storageKey = `vimi_welcomed_${clientId}`;

  // First-visit gate: only show when this device has never seen it. Runs after
  // mount so there is no server/client flash and localStorage is available.
  useEffect(() => {
    try {
      if (!localStorage.getItem(storageKey)) setOpen(true);
    } catch {
      /* private mode / storage blocked — just don't show */
    }
  }, [storageKey]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(storageKey, new Date().toISOString());
    } catch {
      /* ignore */
    }
    setOpen(false);
  }, [storageKey]);

  const isLast = step === TOTAL_STEPS - 1;

  const goNext = useCallback(() => {
    setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
  }, []);
  const goBack = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const handleSeePlan = useCallback(() => {
    dismiss();
    onSeePlan();
  }, [dismiss, onSeePlan]);

  const handleNewRequest = useCallback(() => {
    dismiss();
    router.push("/portal/requests/new");
  }, [dismiss, router]);

  // Lock body scroll, trap focus, and wire ESC while open.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const node = dialogRef.current;
    // Move focus into the dialog on open.
    node?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        dismiss();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const focusable = node.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === node)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, dismiss]);

  if (!open) return null;

  const bottomQuietLabel =
    isLast && !hasMilestones ? t("welcome.s3new.explore") : t("welcome.skip");

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-[rgba(28,27,31,0.55)] backdrop-blur-[6px]"
      role="presentation"
      onMouseDown={(e) => {
        // Click on the dimmed backdrop = skip.
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        tabIndex={-1}
        className="relative flex h-[100dvh] w-full flex-col bg-[var(--vimi-card)] outline-none md:h-auto md:max-h-[90vh] md:w-[520px] md:max-w-[calc(100vw-2rem)] md:rounded-[28px] md:shadow-[0_40px_90px_rgba(28,27,31,0.35)] motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-300"
      >
        {/* ── Top: progress segments + close ── */}
        <div className="flex items-center gap-3 px-6 pt-6 md:px-9 md:pt-8">
          <div className="flex flex-1 items-center gap-1.5">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
              const done = i <= step;
              const navigable = i < step;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={navigable ? () => setStep(i) : undefined}
                  disabled={!navigable}
                  aria-label={t("welcome.step", { n: i + 1 })}
                  aria-current={i === step ? "step" : undefined}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    navigable ? "cursor-pointer" : "cursor-default"
                  }`}
                  style={{
                    background: done ? "var(--accent)" : "rgba(28,27,31,0.1)",
                  }}
                />
              );
            })}
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label={t("welcome.close")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[color:var(--vimi-faint)] transition-colors hover:bg-[color:rgba(28,27,31,0.05)] hover:text-[color:var(--vimi-ink)]"
          >
            <Cancel01Icon size={18} color="currentColor" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 pt-7 md:px-9 md:pt-8">
          {step === 0 && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                {clientLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={clientLogoUrl}
                    alt={clientName}
                    className="h-12 w-auto max-w-[180px] shrink-0 object-contain"
                  />
                ) : (
                  <span
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white"
                    style={{ background: "var(--accent)" }}
                    aria-hidden="true"
                  >
                    {clientName.trim().charAt(0).toUpperCase() || "V"}
                  </span>
                )}
                {/* A wordmark logo already says the name — only render the text when there's no logo. */}
                {!clientLogoUrl && (
                  <span className="text-lg font-bold leading-tight text-[color:var(--vimi-ink)]">
                    {clientName}
                  </span>
                )}
              </div>
              <h2
                id="welcome-title"
                className="font-serif text-[30px] italic leading-[1.12] text-[color:var(--vimi-ink)] md:text-[34px]"
              >
                {t("welcome.s1.title")}
              </h2>
              <p className="text-[15px] leading-relaxed text-[color:var(--vimi-muted)]">
                {t("welcome.s1.body", { client: clientName })}
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-5">
              <h2
                id="welcome-title"
                className="font-serif text-[30px] italic leading-[1.12] text-[color:var(--vimi-ink)] md:text-[34px]"
              >
                {t("welcome.s2.title")}
              </h2>
              {/* Compact horizontal 4-column mini-diagram */}
              <div className="flex items-stretch gap-1.5">
                {flowColumns.map((col, i) => (
                  <div key={col.labelKey} className="flex flex-1 items-center gap-1.5">
                    <div className="flex min-w-0 flex-1 flex-col items-center gap-2 rounded-xl border border-[color:var(--vimi-border)] bg-[var(--vimi-page)] px-1.5 py-3 text-center">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: col.color }}
                      />
                      <span className="text-[10.5px] font-semibold leading-tight text-[color:var(--vimi-ink)]">
                        {t(col.labelKey)}
                      </span>
                    </div>
                    {i < flowColumns.length - 1 && (
                      <span className="shrink-0 text-[color:var(--vimi-faint)]" aria-hidden="true">
                        <ArrowRight01Icon size={14} color="currentColor" />
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[15px] leading-relaxed text-[color:var(--vimi-muted)]">
                {t("welcome.s2.body")}
              </p>
              <div
                className="flex items-center gap-2.5 rounded-2xl border p-3.5"
                style={{
                  background: "var(--status-review-bg)",
                  borderColor: "rgba(201,130,27,0.35)",
                }}
              >
                <span className="shrink-0" style={{ color: "var(--status-review)" }}>
                  <Notification03Icon size={18} color="currentColor" />
                </span>
                <span className="text-[13.5px] font-medium text-[color:var(--vimi-ink)]">
                  {t("welcome.s2.bell")}
                </span>
              </div>
            </div>
          )}

          {step === 2 && hasMilestones && (
            <div className="flex flex-col gap-4">
              <h2
                id="welcome-title"
                className="font-serif text-[30px] italic leading-[1.12] text-[color:var(--vimi-ink)] md:text-[34px]"
              >
                {t("welcome.s3plan.title")}
              </h2>
              <p className="text-[15px] leading-relaxed text-[color:var(--vimi-muted)]">
                {t("welcome.s3plan.body")}
              </p>
              <div
                className="flex items-start gap-2.5 rounded-2xl border p-3.5"
                style={{
                  background: "var(--status-review-bg)",
                  borderColor: "rgba(201,130,27,0.35)",
                }}
              >
                <span
                  className="mt-0.5 h-[9px] w-[9px] shrink-0 rounded-full"
                  style={{ background: "var(--status-review)" }}
                  aria-hidden="true"
                />
                <span className="text-[13.5px] leading-relaxed text-[color:var(--vimi-ink)]">
                  {t("welcome.s3plan.checklist")}
                </span>
              </div>
            </div>
          )}

          {step === 2 && !hasMilestones && (
            <div className="flex flex-col gap-4">
              <h2
                id="welcome-title"
                className="font-serif text-[30px] italic leading-[1.12] text-[color:var(--vimi-ink)] md:text-[34px]"
              >
                {t("welcome.s3new.title")}
              </h2>
              <p className="text-[15px] leading-relaxed text-[color:var(--vimi-muted)]">
                {t("welcome.s3new.body")}
              </p>
            </div>
          )}
        </div>

        {/* ── Footer: nav + persistent skip ── */}
        <div className="flex flex-col gap-3 px-6 pb-7 pt-6 md:px-9 md:pb-8">
          <div className="flex items-center gap-3">
            {step > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="rounded-full px-4 py-3 text-sm font-semibold text-[color:var(--vimi-muted)] transition-colors hover:text-[color:var(--vimi-ink)]"
              >
                {t("welcome.back")}
              </button>
            ) : (
              <span className="flex-1" />
            )}
            <div className="ml-auto">
              {!isLast && (
                <button
                  type="button"
                  onClick={goNext}
                  className="min-h-[44px] rounded-full bg-[color:var(--vimi-ink)] px-6 py-3 text-sm font-semibold text-[var(--vimi-page)] transition-transform hover:-translate-y-0.5"
                >
                  {t("welcome.next")}
                </button>
              )}
              {isLast && hasMilestones && (
                <button
                  type="button"
                  onClick={handleSeePlan}
                  className="min-h-[44px] rounded-full px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                  style={{ background: "var(--accent)" }}
                >
                  {t("welcome.s3plan.cta")}
                </button>
              )}
              {isLast && !hasMilestones && (
                <button
                  type="button"
                  onClick={handleNewRequest}
                  className="min-h-[44px] rounded-full px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                  style={{ background: "var(--accent)" }}
                >
                  {t("welcome.s3new.cta")}
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="mx-auto rounded-full px-4 py-2 text-[13px] font-medium text-[color:var(--vimi-faint)] transition-colors hover:text-[color:var(--vimi-muted)]"
          >
            {bottomQuietLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
