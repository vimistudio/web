"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRealtime } from "@/hooks/use-realtime";
import { useLocale } from "./locale-provider";
import { ArrowRight01Icon, CheckmarkCircle01Icon } from "@/components/ui/icons";

export interface Milestone {
  id: string;
  track: string;
  week: number;
  title: string;
  description: string | null;
  status: "upcoming" | "current" | "done";
  needs_client: boolean;
  client_done: boolean;
  request_id: string | null;
  sort: number;
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
  return (
    <span className="shrink-0 flex items-center justify-center w-[18px] h-[18px]">
      <span className="w-2.5 h-2.5 rounded-full border-2 border-[color:var(--vimi-faint)] opacity-50" />
    </span>
  );
}

export function PlanTracker({ milestones: initial }: { milestones: Milestone[] }) {
  const { t } = useLocale();
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

  const needsItems = milestones.filter((m) => m.needs_client && !m.client_done);
  const hasCurrent = milestones.some((m) => m.status === "current");

  const [expanded, setExpanded] = useState(
    () => needsItems.length > 0 || hasCurrent
  );

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

  // Group milestones by week, weeks ascending, rows by sort then title.
  const weekGroups = useMemo(() => {
    const byWeek: Record<number, Milestone[]> = {};
    for (const m of milestones) {
      if (!byWeek[m.week]) byWeek[m.week] = [];
      byWeek[m.week].push(m);
    }
    return Object.keys(byWeek)
      .map(Number)
      .sort((a, b) => a - b)
      .map((week) => ({
        week,
        items: byWeek[week].sort(
          (a, b) => a.sort - b.sort || a.title.localeCompare(b.title)
        ),
      }));
  }, [milestones]);

  if (total === 0) return null;

  async function handleCheck(id: string) {
    if (pending.has(id)) return;
    setPending((p) => new Set(p).add(id));
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, client_done: true } : m))
    );

    const supabase = createClient();
    const { error } = await supabase
      .from("client_milestones")
      .update({ client_done: true })
      .eq("id", id);

    setPending((p) => {
      const next = new Set(p);
      next.delete(id);
      return next;
    });

    if (error) {
      setMilestones((prev) =>
        prev.map((m) => (m.id === id ? { ...m, client_done: false } : m))
      );
      toast.error("Couldn't save. Please try again.");
      return;
    }

    toast.success(t("plan.checkedToast"));
    fetch("/api/portal/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "milestone_done", milestone_id: id }),
    }).catch(() => {});
    router.refresh();
  }

  const weekLabel = (week: number) =>
    week >= 5 ? t("plan.final") : t("plan.weekLabel", { n: String(week).padStart(2, "0") });

  return (
    <section
      className="rounded-2xl border border-[color:var(--vimi-border)] bg-[var(--vimi-card)] overflow-hidden shadow-[0_2px_8px_rgba(28,27,31,0.04)]"
      aria-label={t("plan.title")}
    >
      {/* Header — always visible, toggles expand/collapse */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="w-full text-left px-4 md:px-5 py-4 flex items-center gap-4 min-h-[44px]"
      >
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h2 className="font-serif italic text-xl md:text-[26px] leading-tight text-[color:var(--vimi-ink)]">
              {t("plan.title")}
            </h2>
            <span className="text-xs font-semibold tracking-[0.06em] text-[color:var(--vimi-faint)] uppercase">
              {allDone ? t("plan.progress", { done: doneCount, total }) : t("plan.week", { n: currentWeek })}
            </span>
          </div>
          {/* Goal-gradient progress */}
          <div className="flex items-center gap-3">
            <div className="h-[5px] flex-1 max-w-[220px] rounded-full bg-[color:rgba(28,27,31,0.08)] overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${progressPct}%`, background: "var(--accent)" }}
              />
            </div>
            <span className="text-xs text-[color:var(--vimi-muted)] shrink-0">
              {t("plan.progress", { done: doneCount, total })}
            </span>
          </div>
        </div>
        <span
          className="shrink-0 text-[color:var(--vimi-faint)] transition-transform duration-200"
          style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
          aria-hidden="true"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </span>
      </button>

      {expanded && (
        <div className="px-4 md:px-5 pb-5 pt-1 flex flex-col gap-6 animate-in fade-in duration-300">
          {allDone && (
            <p className="text-sm text-[color:var(--vimi-muted)] font-serif italic">
              {t("plan.complete")}
            </p>
          )}

          {/* Milestones grouped by week */}
          <div className="flex flex-col gap-5">
            {weekGroups.map(({ week, items }) => (
              <div key={week} className="flex flex-col gap-2.5">
                <div className="text-[11px] font-semibold tracking-[0.12em] text-[color:var(--vimi-faint)]">
                  {weekLabel(week)}
                </div>
                <div className="flex flex-col gap-2.5">
                  {items.map((m) => (
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
                        {m.status === "current" && m.description && (
                          <p className="text-[13px] text-[color:var(--vimi-muted)] leading-relaxed">
                            {m.description}
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
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* What we need from you (Von Restorff amber) */}
          {needsItems.length > 0 && (
            <div
              className="rounded-2xl border p-4 flex flex-col gap-3"
              style={{ background: "var(--status-review-bg)", borderColor: "rgba(201,130,27,0.35)" }}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-[9px] h-[9px] rounded-full animate-pulse shrink-0"
                    style={{ background: "var(--status-review)" }}
                  />
                  <span className="text-sm font-bold text-[color:var(--vimi-ink)]">
                    {t("plan.needsTitle")}
                  </span>
                </div>
                <span className="text-[13px] text-[color:var(--vimi-muted)] pl-[17px]">
                  {t("plan.needsSub")}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {needsItems.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleCheck(m.id)}
                    disabled={pending.has(m.id)}
                    className="flex items-start gap-3 text-left rounded-xl px-2 py-2 min-h-[44px] transition-colors hover:bg-[color:rgba(201,130,27,0.08)] disabled:opacity-60"
                  >
                    <span
                      className="mt-0.5 w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center"
                      style={{ borderColor: "var(--status-review)" }}
                    >
                      {pending.has(m.id) && (
                        <span className="w-2 h-2 rounded-sm" style={{ background: "var(--status-review)" }} />
                      )}
                    </span>
                    <span className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-medium text-[color:var(--vimi-ink)] leading-snug text-pretty">
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
      )}
    </section>
  );
}
