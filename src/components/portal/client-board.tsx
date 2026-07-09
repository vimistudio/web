"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PlusSignIcon, Comment01Icon, Cancel01Icon, Download01Icon, CanvasIcon } from "@/components/ui/icons";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { createClient } from "@/lib/supabase/client";
import { useRealtime } from "@/hooks/use-realtime";
import { useLocale } from "./locale-provider";
import { PlanTracker, type Milestone } from "./plan-tracker";
import { WelcomeOverlay } from "./welcome-overlay";
import { type PortalKey } from "@/lib/portal-i18n";
import {
  STUDIO_WHATSAPP_URL,
  isStudioNoteFresh,
  studioNoteFreshness,
} from "@/lib/studio";
import type { StudioDesigner } from "./portal-shell";

interface Request {
  id: string;
  title: string;
  description: string | null;
  type: "logo" | "social" | "web" | "brand" | "presentation" | "other";
  status: "queued" | "in_progress" | "review" | "done";
  priority: number;
  created_at: string;
  updated_at: string;
  deliverables: { id: string; file_path: string; mime_type: string | null }[];
  comments: { id: string }[];
  previewUrl?: string | null;
}

type RequestStatus = Request["status"];

interface ClientBoardProps {
  clientId: string;
  clientName: string;
  clientLogoUrl?: string | null;
  firstName?: string | null;
  requests: Request[];
  requestCount: number;
  isAdmin?: boolean;
  lastVisitedAt?: string | null;
  milestones?: Milestone[];
  retainerAmount?: number | null;
  dealTerms?: string | null;
  studioNote?: string | null;
  studioNoteUpdatedAt?: string | null;
  designer?: StudioDesigner | null;
}

const statusColumns = [
  { key: "queued" as const, labelKey: "status.queued" as PortalKey, color: "bg-[var(--status-queued)]" },
  { key: "in_progress" as const, labelKey: "status.in_progress" as PortalKey, color: "bg-[var(--status-progress)]" },
  { key: "review" as const, labelKey: "status.review" as PortalKey, color: "bg-[var(--status-review)]" },
  { key: "done" as const, labelKey: "status.done" as PortalKey, color: "bg-[var(--status-done)]" },
];

const typeColors: Record<string, string> = {
  logo: "bg-purple-100 text-purple-700",
  social: "bg-pink-100 text-pink-700",
  web: "bg-blue-100 text-blue-700",
  brand: "bg-amber-100 text-amber-700",
  presentation: "bg-emerald-100 text-emerald-700",
  other: "bg-gray-100 text-gray-700",
};

const typeAccentBg: Record<string, string> = {
  logo: "bg-purple-400",
  social: "bg-pink-400",
  web: "bg-blue-400",
  brand: "bg-amber-400",
  presentation: "bg-emerald-400",
  other: "bg-gray-300",
};

function RequestCardContent({ request, lastVisitedAt }: { request: Request; lastVisitedAt?: string | null }) {
  const { t, locale } = useLocale();
  const timeSince = new Date(request.updated_at).toLocaleDateString(locale === "es" ? "es" : "en-US", {
    month: "short",
    day: "numeric",
  });
  const accent = typeAccentBg[request.type] ?? typeAccentBg.other;
  const isNew = lastVisitedAt && new Date(request.updated_at) > new Date(lastVisitedAt);
  const hasPreview = !!request.previewUrl;

  const isReview = request.status === "review";

  return (
    <div
      className={`group bg-[var(--vimi-card)] rounded-2xl overflow-hidden relative touch-manipulation transition-all duration-150 cursor-pointer border hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(28,27,31,0.09)] active:scale-[0.99] ${
        isReview
          ? "border-[color:rgba(201,130,27,0.5)]"
          : "border-[color:var(--vimi-border)] hover:shadow-md"
      }`}
    >
      {isNew && (
        <div className="absolute top-3 right-3 z-10 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-white animate-pulse" />
      )}
      {/* Smart preview area */}
      {hasPreview ? (
        <div className="relative h-28 md:h-32 overflow-hidden bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={request.previewUrl!}
            alt={request.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : null}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-snug text-[color:var(--vimi-ink)] text-pretty">
            {request.title}
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            {request.comments.length > 0 && (
              <div className="flex items-center gap-1 text-[color:var(--vimi-faint)]">
                <Comment01Icon size={14} />
                <span className="text-xs">{request.comments.length}</span>
              </div>
            )}
            {request.deliverables.length > 0 && (
              <div className="flex items-center gap-1 text-[var(--status-done)]">
                <Download01Icon size={14} />
                <span className="text-xs">{request.deliverables.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Type + status chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-[10px] font-bold tracking-[0.08em] px-2 py-1 rounded-md ${typeColors[request.type] ?? typeColors.other}`}
          >
            {request.type.toUpperCase()}
          </span>
          {isReview && (
            <span className="text-[10px] font-bold tracking-[0.08em] px-2 py-1 rounded-md bg-[var(--status-review-chip)] text-[var(--status-review-ink)]">
              {t("home.card.yourTurn")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-[color:var(--vimi-faint)]">
          <span className="font-medium text-[color:var(--vimi-muted)]">
            {t("board.updated", { date: timeSince })}
          </span>
          {request.status === "in_progress" && (
            <span className="flex items-center gap-1.5 ml-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-progress)] animate-pulse" />
              <span className="text-[10px] text-[var(--status-progress)] font-semibold">{t("board.inTheWorks")}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function RequestCard({ request, lastVisitedAt }: { request: Request; lastVisitedAt?: string | null }) {
  return (
    <Link href={`/portal/requests/${request.id}`}>
      <RequestCardContent request={request} lastVisitedAt={lastVisitedAt} />
    </Link>
  );
}

function DraggableRequestCard({ request }: { request: Request }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: request.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <div
        onClick={(e) => {
          if (!isDragging) {
            router.push(`/portal/requests/${request.id}`);
          }
        }}
        className="cursor-grab active:cursor-grabbing"
      >
        <RequestCardContent request={request} />
      </div>
    </div>
  );
}

const emptyColumnGradients: Record<string, string> = {
  queued: "from-gray-50 to-gray-100/50",
  in_progress: "from-blue-50/50 to-blue-100/30",
  review: "from-amber-50/50 to-amber-100/30",
  done: "from-emerald-50/50 to-emerald-100/30",
};

function DroppableColumn({
  columnKey,
  labelKey,
  color,
  requests,
  canDrag,
  lastVisitedAt,
}: {
  columnKey: string;
  labelKey: PortalKey;
  color: string;
  requests: Request[];
  canDrag: boolean;
  lastVisitedAt?: string | null;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: columnKey });
  const { t } = useLocale();

  return (
    <div
      ref={canDrag ? setNodeRef : undefined}
      className={`space-y-3 rounded-lg transition-colors ${
        isOver && canDrag ? "bg-accent/50 ring-2 ring-primary/20" : ""
      }`}
    >
      <div className="flex items-center gap-2 pb-2 px-1">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-[13px] font-bold text-[color:var(--vimi-ink)]">
          {t(labelKey)}
        </span>
        <span className="text-xs font-semibold text-[color:var(--vimi-faint)] ml-auto">
          {requests.length}
        </span>
      </div>
      <div className="space-y-3 min-h-[60px]">
        {requests.map((request) =>
          canDrag ? (
            <DraggableRequestCard key={request.id} request={request} />
          ) : (
            <RequestCard key={request.id} request={request} lastVisitedAt={lastVisitedAt} />
          )
        )}
      </div>
      {requests.length === 0 && !isOver && (
        <div className={`rounded-xl bg-gradient-to-b ${emptyColumnGradients[columnKey] ?? "from-gray-50 to-gray-100/50"} p-6 text-center`}>
          <p className="text-xs text-muted-foreground/70">
            {t(`board.empty.${columnKey}` as PortalKey)}
          </p>
        </div>
      )}
      {requests.length === 0 && isOver && canDrag && (
        <div className="border-2 border-dashed border-primary/40 rounded-lg p-6 text-center bg-primary/5">
          <p className="text-xs text-primary">{t("board.dropHere")}</p>
        </div>
      )}
    </div>
  );
}

export function ClientBoard({
  clientId,
  clientName,
  clientLogoUrl,
  firstName,
  requests: initialRequests,
  requestCount,
  isAdmin = false,
  lastVisitedAt,
  milestones = [],
  retainerAmount = null,
  dealTerms = null,
  studioNote = null,
  studioNoteUpdatedAt = null,
  designer = null,
}: ClientBoardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale } = useLocale();

  // Ambient studio presence on mobile (the sidebar is desktop-only). Only
  // shown while the note is fresh — a stale note reads as neglect.
  const noteText = studioNote?.trim();
  const showStudioStrip = isStudioNoteFresh(noteText, studioNoteUpdatedAt);
  const studioStripAge = showStudioStrip
    ? studioNoteFreshness(studioNoteUpdatedAt, locale)
    : null;
  const [requests, setRequests] = useState<Request[]>(initialRequests);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("banner_dismissed") === "true";
  });

  // What's New banner — show when returning after 1+ hours
  const bannerData = useMemo(() => {
    const lastVisit = lastVisitedAt ? new Date(lastVisitedAt) : null;
    const hoursSinceVisit = lastVisit
      ? (Date.now() - lastVisit.getTime()) / (1000 * 60 * 60)
      : 0;
    const updatedSinceVisit = lastVisit
      ? requests.filter((r) => new Date(r.updated_at) > lastVisit)
      : [];
    return {
      reviewReady: updatedSinceVisit.filter((r) => r.status === "review").length,
      completed: updatedSinceVisit.filter((r) => r.status === "done").length,
      totalUpdated: updatedSinceVisit.length,
      shouldShow: hoursSinceVisit > 1 && updatedSinceVisit.length > 0,
    };
  }, [requests, lastVisitedAt]);

  const { completed, totalUpdated, shouldShow } = bannerData;

  // Hero derived data
  const reviewRequests = requests.filter((r) => r.status === "review");
  const inProgressCount = requests.filter((r) => r.status === "in_progress").length;
  const firstReview = reviewRequests[0] ?? null;

  // The amber "needs you" banner takes priority whenever something is waiting
  // on the client's review. The "What's New" banner only shows for the
  // non-review update case (returning after 1h+ with other updates).
  const showNeedsYou = reviewRequests.length > 0;
  const showBanner = !bannerDismissed && shouldShow && !showNeedsYou;

  const greetingKey: PortalKey = (() => {
    const h = new Date().getHours();
    if (h < 12) return "home.greeting.morning";
    if (h < 19) return "home.greeting.afternoon";
    return "home.greeting.evening";
  })();
  const greeting = firstName
    ? `${t(greetingKey)}, ${firstName}.`
    : `${t(greetingKey)}.`;
  const todayEyebrow = new Date()
    .toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
    .toUpperCase();

  const NewRequestPill = (
    <Link href="/portal/requests/new" className="hidden md:inline-flex">
      <button className="inline-flex items-center gap-2 bg-[color:var(--vimi-ink)] text-[var(--vimi-page)] rounded-full px-6 py-3.5 text-sm font-semibold shadow-[0_10px_26px_rgba(28,27,31,0.22)] transition-transform hover:-translate-y-0.5">
        <PlusSignIcon size={16} color="currentColor" />
        {t("board.newRequest")}
      </button>
    </Link>
  );

  // Require 8px movement before drag starts — prevents accidental drags on click
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const activeRequest = activeId
    ? requests.find((r) => r.id === activeId) ?? null
    : null;

  // Realtime: live status updates from admin
  useRealtime({
    table: "requests",
    event: "UPDATE",
    onEvent: () => router.refresh(),
  });

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;

      const requestId = active.id as string;
      const newStatus = over.id as RequestStatus;

      const request = requests.find((r) => r.id === requestId);
      if (!request || request.status === newStatus) return;

      // Optimistic update
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, status: newStatus } : r
        )
      );

      // Persist to Supabase
      const supabase = createClient();
      const { error } = await supabase
        .from("requests")
        .update({ status: newStatus })
        .eq("id", requestId);

      if (error) {
        // Revert on failure
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId ? { ...r, status: request.status } : r
          )
        );
      } else {
        router.refresh();
      }
    },
    [requests, router]
  );

  const hasRequests = requests.length > 0;

  const scrollToPlan = useCallback(() => {
    const el = document.getElementById("plan-tracker");
    if (!el) return;
    // Force the tracker open in case the client has it collapsed.
    window.dispatchEvent(new CustomEvent("vimi:plan-expand"));
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, []);

  // Status summary dots (hide zero segments)
  const summarySegments = [
    reviewRequests.length > 0
      ? { color: "var(--status-review)", label: t("home.summary.review", { count: reviewRequests.length }), strong: true }
      : null,
    inProgressCount > 0
      ? { color: "var(--status-progress)", label: t("home.summary.inProgress", { count: inProgressCount }), strong: false }
      : null,
  ].filter(Boolean) as { color: string; label: string; strong: boolean }[];

  return (
    <div className="space-y-5 md:space-y-7">
      {/* First-visit welcome — clients only, never for admins/impersonation */}
      {!isAdmin && (
        <WelcomeOverlay
          clientId={clientId}
          clientName={clientName}
          clientLogoUrl={clientLogoUrl}
          hasMilestones={milestones.length > 0}
          onSeePlan={scrollToPlan}
        />
      )}

      {/* ── Hero ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2 md:gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="text-[11px] md:text-xs font-semibold tracking-[0.12em] text-[color:var(--vimi-faint)]">
            {todayEyebrow}
          </div>
          <h1 className="font-serif italic text-[30px] md:text-[40px] leading-[1.08] tracking-tight text-[color:var(--vimi-ink)]">
            {greeting}
          </h1>
          {summarySegments.length > 0 ? (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[color:var(--vimi-muted)]">
              {summarySegments.map((seg, i) => (
                <span key={i} className="inline-flex items-center gap-2">
                  {i > 0 && <span className="text-[color:var(--vimi-faint)]">·</span>}
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-[7px] h-[7px] rounded-full" style={{ background: seg.color }} />
                    <span className={seg.strong ? "font-semibold text-[color:var(--vimi-ink)]" : ""}>{seg.label}</span>
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[color:var(--vimi-muted)]">
              {t("board.workingOn", { count: requestCount, s: requestCount === 1 ? "" : "s" })}
            </p>
          )}
        </div>
        {NewRequestPill}
      </div>

      {/* ── Mobile studio strip (ambient presence; sidebar is desktop-only) ──
          Intentionally quiet so it never competes with the needs-you banner. */}
      {showStudioStrip && noteText && (
        <a
          href={STUDIO_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="md:hidden flex items-center gap-3 rounded-2xl bg-[color:rgba(28,27,31,0.03)] px-3.5 py-2.5"
        >
          {designer?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={designer.avatar_url}
              alt={designer.full_name ?? "Vimi Studio"}
              className="w-8 h-8 rounded-full object-cover shrink-0"
            />
          ) : (
            <span className="w-8 h-8 rounded-full bg-[#5B4BD6] text-white flex items-center justify-center font-bold text-xs shrink-0">
              {designer?.full_name?.charAt(0).toUpperCase() || "V"}
            </span>
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-serif italic text-[13px] leading-snug text-[color:var(--vimi-muted)] truncate">
              &ldquo;{noteText}&rdquo;
            </span>
            {studioStripAge && (
              <span className="text-[10.5px] text-[color:var(--vimi-faint)]">
                {studioStripAge}
              </span>
            )}
          </div>
          {/* Quiet WhatsApp affordance — a hint the strip is tappable, never a shout */}
          <span className="ml-auto flex items-center gap-1 shrink-0 text-[10.5px] text-[color:var(--vimi-faint)]">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#25D366]" aria-hidden="true">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.13c-.24.68-1.42 1.32-1.95 1.36-.5.04-.96.24-3.23-.67-2.72-1.07-4.44-3.85-4.57-4.03-.13-.18-1.1-1.46-1.1-2.78 0-1.32.69-1.97.94-2.24.24-.27.53-.34.71-.34.18 0 .35 0 .5.01.16.01.38-.06.59.45.24.58.82 2 .89 2.14.07.14.12.31.02.49-.09.18-.14.29-.27.45-.13.16-.28.35-.4.47-.13.13-.27.28-.12.54.15.27.66 1.09 1.42 1.77.98.87 1.8 1.14 2.06 1.27.26.13.41.11.56-.07.15-.18.65-.76.83-1.02.18-.27.35-.22.59-.13.24.09 1.52.72 1.78.85.26.13.43.2.5.31.06.11.06.63-.18 1.31Z" />
            </svg>
            <span className="whitespace-nowrap">{t("board.studio.writeUs")} &rarr;</span>
          </span>
        </a>
      )}

      {/* Mobile FAB */}
      <Link href="/portal/requests/new">
        <Button
          size="icon"
          className="md:hidden rounded-full h-14 w-14 bg-[color:var(--vimi-ink)] text-[var(--vimi-page)] shadow-[0_10px_26px_rgba(28,27,31,0.28)] fixed bottom-24 right-4 z-50"
        >
          <PlusSignIcon size={22} color="currentColor" />
        </Button>
      </Link>

      {/* ── Plan tracker (renders nothing when the client has no plan) ── */}
      {milestones.length > 0 && (
        <div id="plan-tracker" className="scroll-mt-24">
          <PlanTracker
            clientId={clientId}
            milestones={milestones}
            retainerAmount={retainerAmount}
            dealTerms={dealTerms}
            isImpersonatingAdmin={isAdmin}
          />
        </div>
      )}

      {/* ── Needs-you banner (amber) — highest priority ── */}
      {showNeedsYou && firstReview && (
        <div
          onClick={() => router.push(`/portal/requests/${firstReview.id}`)}
          className="cursor-pointer rounded-2xl border p-4 md:px-5 flex items-center gap-4 flex-wrap animate-in fade-in slide-in-from-top-2 duration-400"
          style={{ background: "var(--status-review-bg)", borderColor: "rgba(201,130,27,0.35)" }}
        >
          <span className="w-[9px] h-[9px] rounded-full shrink-0 animate-pulse" style={{ background: "var(--status-review)" }} />
          <div className="flex flex-col gap-0.5 min-w-[180px] flex-1">
            <span className="text-sm md:text-[14.5px] font-bold text-[color:var(--vimi-ink)] leading-snug">
              {firstReview.title}
            </span>
            <span className="text-xs md:text-[13px] text-[color:var(--vimi-muted)]">
              {t("home.needsYou.sub")}
              {reviewRequests.length > 1 && ` · ${t("home.needsYou.more", { count: reviewRequests.length - 1 })}`}
            </span>
          </div>
          <button
            className="rounded-full px-5 py-2.5 text-[13.5px] font-semibold text-white shrink-0 inline-flex items-center gap-1"
            style={{ background: "var(--status-review)" }}
          >
            {t("home.needsYou.cta")} →
          </button>
        </div>
      )}

      {/* ── What's New banner (non-review updates only) ── */}
      {showBanner && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-500">
          <div>
            <p className="text-sm font-medium">{t("board.welcomeBack")}</p>
            <p className="text-xs text-[color:var(--vimi-muted)]">
              {t("board.sinceLastVisit")}{" "}
              {completed > 0 && t("board.delivered", { count: completed, s: completed > 1 ? "s" : "" })}
              {completed === 0 && t("board.updates", { count: totalUpdated, word: t(totalUpdated > 1 ? "board.update.many" : "board.update.one") })}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setBannerDismissed(true); sessionStorage.setItem("banner_dismissed", "true"); }}
            className="text-[color:var(--vimi-faint)] hover:text-[color:var(--vimi-ink)] p-1 shrink-0"
          >
            <Cancel01Icon size={16} />
          </button>
        </div>
      )}

      {/* ── View toggle: pill segmented control (desktop) ── */}
      <div className="hidden md:flex items-center gap-3">
        <div className="inline-flex bg-[color:rgba(28,27,31,0.06)] rounded-full p-[3px] gap-0.5">
          <Link
            href="/portal"
            className={`px-[18px] py-2 rounded-full text-[13px] font-semibold transition-colors ${
              pathname === "/portal"
                ? "bg-white text-[color:var(--vimi-ink)] shadow-[0_2px_6px_rgba(28,27,31,0.1)]"
                : "text-[color:var(--vimi-muted)] hover:text-[color:var(--vimi-ink)]"
            }`}
          >
            {t("tab.board")}
          </Link>
          <Link
            href="/portal/gallery"
            className={`px-[18px] py-2 rounded-full text-[13px] font-semibold transition-colors ${
              pathname === "/portal/gallery"
                ? "bg-white text-[color:var(--vimi-ink)] shadow-[0_2px_6px_rgba(28,27,31,0.1)]"
                : "text-[color:var(--vimi-muted)] hover:text-[color:var(--vimi-ink)]"
            }`}
          >
            {t("tab.gallery")}
          </Link>
        </div>
      </div>

      {/* Mobile: Board/Gallery tabs */}
      <div className="flex gap-4 border-b md:hidden">
        <Link
          href="/portal"
          className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${
            pathname === "/portal"
              ? "border-[color:var(--vimi-ink)] text-[color:var(--vimi-ink)]"
              : "border-transparent text-[color:var(--vimi-muted)]"
          }`}
        >
          {t("tab.board")}
        </Link>
        <Link
          href="/portal/gallery"
          className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
            pathname === "/portal/gallery"
              ? "border-[color:var(--vimi-ink)] text-[color:var(--vimi-ink)]"
              : "border-transparent text-[color:var(--vimi-muted)]"
          }`}
        >
          {t("tab.gallery")}
        </Link>
      </div>

      {/* Desktop: welcome hero when no requests, else 4-column kanban */}
      {!hasRequests ? (
        <div className="hidden md:flex flex-col items-center justify-center text-center rounded-3xl border border-[color:var(--vimi-border)] bg-[var(--vimi-card)] px-8 py-20 shadow-[0_24px_60px_rgba(28,27,31,0.06)]">
          <div
            aria-hidden="true"
            className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
            style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent)" }}
          >
            <CanvasIcon size={24} color="currentColor" />
          </div>
          <h2 className="font-serif italic text-[32px] leading-tight mb-2 text-[color:var(--vimi-ink)]">
            {t("board.emptyTitle")}
          </h2>
          <p className="text-[color:var(--vimi-muted)] max-w-md mb-7">
            {t("board.emptyBody")} {t("board.emptyCta")}
          </p>
          <Link href="/portal/requests/new">
            <button className="inline-flex items-center gap-2 bg-[color:var(--vimi-ink)] text-[var(--vimi-page)] rounded-full px-6 py-3.5 text-sm font-semibold shadow-[0_10px_26px_rgba(28,27,31,0.22)] transition-transform hover:-translate-y-0.5">
              <PlusSignIcon size={16} color="currentColor" />
              {t("board.newRequest")}
            </button>
          </Link>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="hidden md:grid grid-cols-4 gap-[18px] min-h-[50vh] items-start">
            {statusColumns.map((col) => {
              const colRequests = requests.filter((r) => r.status === col.key);
              return (
                <DroppableColumn
                  key={col.key}
                  columnKey={col.key}
                  labelKey={col.labelKey}
                  color={col.color}
                  requests={colRequests}
                  canDrag={isAdmin}
                  lastVisitedAt={lastVisitedAt}
                />
              );
            })}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeRequest ? (
              <div className="opacity-90 rotate-2 scale-105 shadow-xl">
                <RequestCardContent request={activeRequest} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Mobile: stacked cards by status */}
      <div className="md:hidden space-y-3">
        {statusColumns.map((col) => {
          const colRequests = requests.filter((r) => r.status === col.key);
          if (colRequests.length === 0) return null;
          return (
            <div key={col.key} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${col.color}`} />
                <h2 className="text-sm font-medium text-muted-foreground">
                  {t(col.labelKey)}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {colRequests.length}
                </span>
              </div>
              {colRequests.map((request) => (
                <RequestCard key={request.id} request={request} lastVisitedAt={lastVisitedAt} />
              ))}
            </div>
          );
        })}

        {requests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div
              aria-hidden="true"
              className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent)" }}
            >
              <CanvasIcon size={24} color="currentColor" />
            </div>
            <h2 className="font-serif italic text-2xl mb-2 text-[color:var(--vimi-ink)]">{t("board.emptyTitle")}</h2>
            <p className="text-[color:var(--vimi-muted)] max-w-sm mb-6">
              {t("board.emptyBody")} {t("board.emptyCta")}
            </p>
            <Link href="/portal/requests/new">
              <button className="inline-flex items-center gap-2 bg-[color:var(--vimi-ink)] text-[var(--vimi-page)] rounded-full px-6 py-3 text-sm font-semibold shadow-[0_10px_26px_rgba(28,27,31,0.22)]">
                <PlusSignIcon size={16} color="currentColor" />
                {t("board.newRequest")}
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
