"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRealtime } from "@/hooks/use-realtime";
import { useLocale } from "./locale-provider";
import { usePricePrivacy, maskPrice } from "@/hooks/use-price-privacy";
import { ArrowRight01Icon, CheckmarkCircle01Icon } from "@/components/ui/icons";

export interface Milestone {
  id: string;
  track: string;
  week: number;
  title: string;
  description: string | null;
  status: "upcoming" | "current" | "done" | "delayed";
  needs_client: boolean;
  client_done: boolean;
  request_id: string | null;
  sort: number;
  delay_note: string | null;
}

function StatusDot({ status }: { status: Milestone["status"] }) {
  if (status === "done") {
    return (
      <span className="text-[var(--status-done)] shrink-0 flex items-center justify-center w-[18px] h-[18px]">
        <CheckmarkCircle01Icon size={18} color="currentColor" />
      </span>
    );
  }
  if (status === "current") {
    return (
      <span className="shrink-0 flex items-center justify-center w-[18px] h-[18px]">
        <span
          className="w-2.5 h-2.5 rounded-full animate-pulse"
          style={{ background: "var(--accent)" }}
        />
      </span>
    );
  }
  if (status === "delayed") {
    return (
      <span className="shrink-0 flex items-center justify-center w-[18px] h-[18px]">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#B03A5B" }} />
      </span>
    );
  }
  return (
    <span className="shrink-0 flex items-center justify-center w-[18px] h-[18px]">
      <span className="w-2.5 h-2.5 rounded-full border-2 border-[color:var(--vimi-faint)] opacity-50" />
    </span>
  );
}

// Milestones map onto a fixed 5-segment month rail: SEM 01-04, then a final
// delivery bucket (any milestone in week ≥ 5). Defensive clamp keeps stray
// week numbers in range.
const segmentOf = (week: number) => Math.min(5, Math.max(1, week));
// Circumference of the r=16 collapsed-bar progress ring.
const RING_C = 2 * Math.PI * 16;

export function PlanTracker({
  clientId,
  milestones: initial,
  retainerAmount = null,
  dealTerms = null,
  isImpersonatingAdmin = false,
}: {
  clientId: string;
  milestones: Milestone[];
  retainerAmount?: number | null;
  dealTerms?: string | null;
  isImpersonatingAdmin?: boolean;
}) {
  const { t } = useLocale();
  // Client sees their own price (correct). An admin viewing via impersonation
  // gets it masked when the screen-share price toggle is on.
  const { hidden: pricesHidden } = usePricePrivacy();
  const router = useRouter();
  const [milestones, setMilestones] = useState<Milestone[]>(initial);
  const [pending, setPending] = useState<Set<string>>(new Set());

  // Live updates when an admin edits the plan.
  useRealtime({
    table: "client_milestones",
    event: "*",
    onEvent: () => router.refresh(),
  });

  const total = milestones.length;
  const doneCount = milestones.filter((m) => m.status === "done").length;
  const progressPct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  // All client-owed items form the checklist; pending ones drive the "action
  // needed" signals (auto-expand heuristic, collapsed chip, pulse dot).
  const needsClientItems = milestones.filter((m) => m.needs_client);
  const needsItems = needsClientItems.filter((m) => !m.client_done);

  const storageKey = `vimi_plan_open_${clientId}`;

  // Collapsed by default for everyone — the board leads; the plan is a glance.
  // A stored user preference (applied after mount to keep SSR deterministic and
  // avoid a hydration mismatch) or the welcome overlay's "see my plan" event
  // can expand it.
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored === "0") setExpanded(false);
    else if (stored === "1") setExpanded(true);
  }, [storageKey]);

  // "Ver mi plan" from the welcome overlay forces the tracker open.
  useEffect(() => {
    const onExpand = () => {
      setExpanded(true);
      localStorage.setItem(storageKey, "1");
    };
    window.addEventListener("vimi:plan-expand", onExpand);
    return () => window.removeEventListener("vimi:plan-expand", onExpand);
  }, [storageKey]);

  const toggleExpanded = () =>
    setExpanded((e) => {
      const next = !e;
      localStorage.setItem(storageKey, next ? "1" : "0");
      return next;
    });

  // Admin notify fires only after the undo window; keyed by milestone id so
  // multiple check-offs stay independent. Cleared on undo, uncheck, or unmount.
  const notifyTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  useEffect(() => {
    const timers = notifyTimers.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  // Lowest week with an unfinished milestone → "Semana X de 4" (display clamps
  // to 4; week 5 is the final-delivery bucket).
  const currentWeek = useMemo(() => {
    const openWeeks = milestones
      .filter((m) => m.status !== "done")
      .map((m) => m.week);
    if (openWeeks.length === 0) return 4;
    return Math.min(4, Math.min(...openWeeks));
  }, [milestones]);

  const allDone = total > 0 && doneCount === total;

  const showDeal = retainerAmount != null && retainerAmount > 0;
  // Base line is the amount; per-client deal_terms (authored in the client's
  // language) is appended verbatim — never a hardcoded studio-wide policy.
  const dealLine = showDeal
    ? `${t("plan.dealLine", { amount: retainerAmount.toLocaleString() })}${
        dealTerms ? ` · ${dealTerms}` : ""
      }`
    : "";
  // During impersonation the screen-share eye masks the whole line, not just
  // the number.
  const dealLineDisplay = maskPrice(
    dealLine,
    isImpersonatingAdmin && pricesHidden
  );

  // Fixed 5-segment month rail; each segment carries its milestones plus a
  // short note (the segment's milestone titles) for the quiet chips.
  const railSegments = useMemo(
    () =>
      [1, 2, 3, 4, 5].map((seg) => {
        const items = milestones
          .filter((m) => segmentOf(m.week) === seg)
          .sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title));
        return { seg, items, note: items.map((i) => i.title).join(" · ") };
      }),
    [milestones]
  );

  // Current segment = lowest segment with unfinished work (max 5). When the
  // plan is complete, feature the last segment that has milestones.
  const currentSegment = useMemo(() => {
    const open = milestones
      .filter((m) => m.status !== "done")
      .map((m) => segmentOf(m.week));
    if (open.length > 0) return Math.min(...open);
    const all = milestones.map((m) => segmentOf(m.week));
    return all.length > 0 ? Math.max(...all) : 1;
  }, [milestones]);

  const [selectedWeek, setSelectedWeek] = useState(currentSegment);
  const selectedItems =
    railSegments.find((s) => s.seg === selectedWeek)?.items ?? [];
  const currentSummary =
    railSegments.find((s) => s.seg === currentSegment)?.note ?? "";

  if (total === 0) return null;

  const setClientDone = (id: string, value: boolean) =>
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, client_done: value } : m))
    );

  const persistClientDone = (id: string, value: boolean) =>
    createClient()
      .from("client_milestones")
      .update({ client_done: value })
      .eq("id", id);

  function cancelNotify(id: string) {
    const timer = notifyTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      notifyTimers.current.delete(id);
    }
  }

  // Revert a just-checked item before the notify fires — no email is sent.
  async function undoCheck(id: string) {
    cancelNotify(id);
    setClientDone(id, false);
    const { error } = await persistClientDone(id, false);
    if (error) {
      setClientDone(id, true);
      toast.error(t("plan.saveError"), { id: `milestone-${id}` });
      return;
    }
    router.refresh();
  }

  async function handleToggle(id: string) {
    if (pending.has(id)) return;
    const current = milestones.find((m) => m.id === id);
    if (!current) return;
    const next = !current.client_done;

    setPending((p) => new Set(p).add(id));
    setClientDone(id, next);

    const { error } = await persistClientDone(id, next);

    setPending((p) => {
      const nextPending = new Set(p);
      nextPending.delete(id);
      return nextPending;
    });

    if (error) {
      setClientDone(id, !next);
      toast.error(t("plan.saveError"), { id: `milestone-${id}` });
      return;
    }

    if (next) {
      // Delay the admin notify past the undo window; cancel on undo/uncheck.
      const timer = setTimeout(() => {
        notifyTimers.current.delete(id);
        fetch("/api/portal/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "milestone_done", milestone_id: id }),
        }).catch(() => {});
      }, 8000);
      notifyTimers.current.set(id, timer);

      // Stable per-milestone id so check / undo / uncheck REPLACE each other
      // instead of stacking (a fast check→uncheck used to show two toasts).
      toast.success(t("plan.checkedToast"), {
        id: `milestone-${id}`,
        duration: 7000,
        action: { label: t("plan.undo"), onClick: () => undoCheck(id) },
      });
    } else {
      // Unchecking: kill any pending notify, never send one.
      cancelNotify(id);
      toast(t("plan.uncheckedToast"), { id: `milestone-${id}` });
    }
    router.refresh();
  }

  return (
    <section
      className="rounded-2xl border border-[color:var(--vimi-border)] bg-[var(--vimi-card)] overflow-hidden shadow-[0_2px_8px_rgba(28,27,31,0.04)]"
      aria-label={t("plan.title")}
    >
      {!expanded ? (
        /* ── COLLAPSED BAR — one row, the whole thing clickable ── */
        <button
          type="button"
          onClick={toggleExpanded}
          aria-expanded={false}
          className="w-full text-left px-4 md:px-5 py-4 flex items-center gap-4 min-h-[72px]"
        >
          {/* Progress ring */}
          <span className="relative w-[38px] h-[38px] shrink-0">
            <svg viewBox="0 0 38 38" className="-rotate-90">
              <circle cx="19" cy="19" r="16" fill="none" stroke="rgba(28,27,31,0.08)" strokeWidth="4" />
              <circle
                cx="19"
                cy="19"
                r="16"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C * (1 - progressPct / 100)}
                className="transition-[stroke-dashoffset] duration-500"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-[color:var(--vimi-ink)]">
              {progressPct}%
            </span>
          </span>

          <span className="flex flex-col gap-0.5 min-w-0 flex-1">
            <span className="font-serif italic text-lg md:text-xl leading-tight text-[color:var(--vimi-ink)]">
              {t("plan.title")}
            </span>
            <span className="text-[12.5px] text-[color:var(--vimi-muted)] truncate">
              {allDone
                ? t("plan.progress", { done: doneCount, total })
                : `${t("plan.week", { n: currentWeek })}${currentSummary ? ` · ${currentSummary}` : ""}`}
            </span>
          </span>

          {/* Zeigarnik signal: amber count of client-owed items */}
          {needsItems.length > 0 && (
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0"
              style={{ background: "var(--status-review-chip)", color: "var(--status-review-ink)" }}
            >
              <span
                className="w-[7px] h-[7px] rounded-full animate-pulse"
                style={{ background: "var(--status-review)" }}
              />
              {t("plan.waitingChip", { n: needsItems.length })}
            </span>
          )}
          <span className="shrink-0 text-[color:var(--vimi-faint)]" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </button>
      ) : (
        /* ── EXPANDED — week rail + selected week detail ── */
        <div className="flex flex-col animate-in fade-in duration-300">
          {/* Header, clickable to collapse */}
          <button
            type="button"
            onClick={toggleExpanded}
            aria-expanded
            className="w-full text-left px-4 md:px-5 pt-4 pb-1 flex items-baseline gap-3 min-h-[44px]"
          >
            <span className="font-serif italic text-xl md:text-2xl leading-tight text-[color:var(--vimi-ink)]">
              {t("plan.title")}
            </span>
            <span className="text-xs font-semibold tracking-[0.08em] text-[color:var(--vimi-faint)] uppercase">
              {allDone ? t("plan.progress", { done: doneCount, total }) : t("plan.week", { n: currentWeek })}
            </span>
            <span className="ml-auto shrink-0 text-[color:var(--vimi-faint)]" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </span>
          </button>

          <div className="px-4 md:px-5 pb-5 flex flex-col gap-5">
            {showDeal && (
              <div className="text-[13px] text-[color:var(--vimi-muted)]">
                {dealLineDisplay}
              </div>
            )}

            {allDone && (
              <p className="text-sm text-[color:var(--vimi-muted)] font-serif italic">
                {t("plan.complete")}
              </p>
            )}

            {/* Week rail — scrolls horizontally on mobile */}
            <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
              {railSegments.map(({ seg, note }) => {
                const isSelected = seg === selectedWeek;
                const isCurrent = seg === currentSegment;
                const name =
                  seg >= 5
                    ? t("plan.railFinal")
                    : t("plan.railWeek", { n: String(seg).padStart(2, "0") });
                return (
                  <button
                    key={seg}
                    type="button"
                    onClick={() => setSelectedWeek(seg)}
                    aria-pressed={isSelected}
                    className={`shrink-0 min-h-[44px] flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition-all ${
                      isSelected ? "min-w-[180px] max-w-[220px]" : "min-w-[120px] max-w-[150px]"
                    }`}
                    style={{
                      borderColor: isSelected ? "var(--accent)" : "var(--vimi-border)",
                      borderWidth: isSelected ? "1.5px" : "1px",
                      background: isSelected
                        ? "color-mix(in srgb, var(--accent) 6%, var(--vimi-card))"
                        : "var(--vimi-card)",
                    }}
                  >
                    <span
                      className="text-[10px] font-extrabold tracking-[0.1em]"
                      style={{ color: isSelected ? "var(--accent)" : "var(--vimi-faint)" }}
                    >
                      {name}
                      {isCurrent && ` · ${t("plan.railNow")}`}
                    </span>
                    <span
                      className="text-xs font-medium truncate max-w-full"
                      style={{ color: isSelected ? "var(--vimi-ink)" : "var(--vimi-faint)" }}
                    >
                      {note || "—"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected week detail */}
            <div className="flex flex-col gap-2.5">
              {selectedItems.length === 0 ? (
                <p className="text-[13px] text-[color:var(--vimi-muted)]">
                  {t("plan.weekEmpty")}
                </p>
              ) : (
                selectedItems.map((m) => (
                  <div key={m.id} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <StatusDot status={m.status} />
                    </div>
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold tracking-[0.08em] px-2 py-0.5 rounded-md bg-[color:rgba(28,27,31,0.06)] text-[color:var(--vimi-muted)] uppercase">
                          {m.track}
                        </span>
                        <span
                          className={`text-sm leading-snug text-pretty ${
                            m.status === "done"
                              ? "text-[color:var(--vimi-muted)] line-through decoration-[color:var(--vimi-faint)]"
                              : "text-[color:var(--vimi-ink)] font-medium"
                          }`}
                        >
                          {m.title}
                        </span>
                      </div>
                      {m.description && (
                        <p className="text-[13px] text-[color:var(--vimi-muted)] leading-relaxed">
                          {m.description}
                        </p>
                      )}
                      {m.status === "delayed" && m.delay_note && (
                        <p
                          className="text-[13px] leading-relaxed font-medium"
                          style={{ color: "#B03A5B" }}
                        >
                          {t("plan.delayed", { note: m.delay_note })}
                        </p>
                      )}
                      {m.request_id && (
                        <Link
                          href={`/portal/requests/${m.request_id}`}
                          className="inline-flex items-center gap-1 text-[13px] font-semibold w-fit"
                          style={{ color: "var(--accent)" }}
                        >
                          {t("plan.viewCard")}
                          <ArrowRight01Icon size={14} color="currentColor" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

          {/* What we need from you (Von Restorff amber) — a toggleable
              checklist; checked items stay so a mis-tap can be undone. */}
          {needsClientItems.length > 0 && (
            <div
              className="rounded-2xl border p-4 flex flex-col gap-3"
              style={{ background: "var(--status-review-bg)", borderColor: "rgba(201,130,27,0.35)" }}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-[9px] h-[9px] rounded-full shrink-0 ${needsItems.length > 0 ? "animate-pulse" : ""}`}
                    style={{ background: "var(--status-review)" }}
                  />
                  <span className="text-sm font-bold text-[color:var(--vimi-ink)]">
                    {t("plan.needsTitle")}
                  </span>
                </div>
                <span className="text-[13px] text-[color:var(--vimi-muted)] pl-[17px]">
                  {needsItems.length > 0 ? t("plan.needsSub") : t("plan.allCaughtUp")}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {needsClientItems.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleToggle(m.id)}
                    disabled={pending.has(m.id)}
                    aria-pressed={m.client_done}
                    className="flex items-start gap-3 text-left rounded-xl px-2 py-2 min-h-[44px] transition-colors hover:bg-[color:rgba(201,130,27,0.08)] disabled:opacity-60"
                  >
                    <span
                      className="mt-0.5 w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center"
                      style={{
                        borderColor: "var(--status-review)",
                        background: m.client_done ? "var(--status-review)" : "transparent",
                      }}
                    >
                      {m.client_done ? (
                        <CheckmarkCircle01Icon size={14} color="#fff" />
                      ) : (
                        pending.has(m.id) && (
                          <span className="w-2 h-2 rounded-sm" style={{ background: "var(--status-review)" }} />
                        )
                      )}
                    </span>
                    <span className="flex flex-col gap-0.5 min-w-0">
                      <span
                        className={`text-sm font-medium leading-snug text-pretty ${
                          m.client_done
                            ? "text-[color:var(--vimi-muted)] line-through decoration-[color:var(--vimi-faint)]"
                            : "text-[color:var(--vimi-ink)]"
                        }`}
                      >
                        {m.title}
                      </span>
                      {m.description && (
                        <span className="text-[13px] text-[color:var(--vimi-muted)] leading-relaxed">
                          {m.description}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>
      )}
    </section>
  );
}
