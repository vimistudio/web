"use client";

import { useState, useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusSignIcon, Comment01Icon, Cancel01Icon, Download01Icon } from "@/components/ui/icons";
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
import { type PortalKey } from "@/lib/portal-i18n";

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
}

type RequestStatus = Request["status"];

interface ClientBoardProps {
  clientName: string;
  requests: Request[];
  requestCount: number;
  isAdmin?: boolean;
  lastVisitedAt?: string | null;
}

const statusColumns = [
  { key: "queued" as const, labelKey: "status.queued" as PortalKey, color: "bg-gray-400" },
  { key: "in_progress" as const, labelKey: "status.in_progress" as PortalKey, color: "bg-blue-500" },
  { key: "review" as const, labelKey: "status.review" as PortalKey, color: "bg-amber-500" },
  { key: "done" as const, labelKey: "status.done" as PortalKey, color: "bg-emerald-500" },
];

const typeColors: Record<string, string> = {
  logo: "bg-purple-100 text-purple-700",
  social: "bg-pink-100 text-pink-700",
  web: "bg-blue-100 text-blue-700",
  brand: "bg-amber-100 text-amber-700",
  presentation: "bg-emerald-100 text-emerald-700",
  other: "bg-gray-100 text-gray-700",
};

const typeGradients: Record<string, string> = {
  logo: "from-purple-100 to-purple-50",
  social: "from-pink-100 to-pink-50",
  web: "from-blue-100 to-blue-50",
  brand: "from-amber-100 to-amber-50",
  presentation: "from-emerald-100 to-emerald-50",
  other: "from-gray-100 to-gray-50",
};

function RequestCardContent({ request, lastVisitedAt }: { request: Request; lastVisitedAt?: string | null }) {
  const timeSince = new Date(request.updated_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const gradient = typeGradients[request.type] ?? typeGradients.other;
  const isNew = lastVisitedAt && new Date(request.updated_at) > new Date(lastVisitedAt);

  return (
    <Card className={`hover:shadow-md active:scale-[0.98] transition-all duration-150 cursor-pointer overflow-hidden relative touch-manipulation ${
      request.status === "review" ? "ring-2 ring-amber-300 ring-offset-1" : ""
    }`}>
      {isNew && (
        <div className="absolute top-2 right-2 z-10 w-2.5 h-2.5 rounded-full bg-[#909af7] ring-2 ring-white animate-pulse" />
      )}
      <div
        className={`h-16 md:h-20 bg-gradient-to-br ${gradient}`}
      />
      <CardContent className="p-3 md:p-4 space-y-2">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-sm leading-tight">
            {request.title}
          </h3>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {request.comments.length > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Comment01Icon size={14} />
                <span className="text-xs">{request.comments.length}</span>
              </div>
            )}
            {request.deliverables.length > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Download01Icon size={14} />
                <span className="text-xs">{request.deliverables.length}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={`text-[10px] px-1.5 py-0 ${typeColors[request.type] ?? typeColors.other}`}
          >
            {request.type.toUpperCase()}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Updated {timeSince}
          </span>
          {request.status === "in_progress" && (
            <span className="flex items-center gap-1 ml-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] text-blue-600 font-medium">In the works</span>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
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
      <div className="flex items-center gap-2 pb-2">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-sm font-semibold text-muted-foreground">
          {t(labelKey)}
        </span>
        <span className="text-xs text-muted-foreground ml-auto">
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
          <p className="text-xs text-primary">Drop here</p>
        </div>
      )}
    </div>
  );
}

export function ClientBoard({
  clientName,
  requests: initialRequests,
  requestCount,
  isAdmin = false,
  lastVisitedAt,
}: ClientBoardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLocale();
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

  const { reviewReady, completed, totalUpdated, shouldShow } = bannerData;
  const showBanner = !bannerDismissed && shouldShow;

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

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {clientName}
            </h1>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hidden md:inline-flex">
              Active
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            We&apos;re working on {requestCount} design{requestCount === 1 ? "" : "s"} for you
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Board / Gallery toggle — desktop only */}
          <div className="hidden md:flex gap-1 bg-[#f0eeec] rounded-lg p-1">
            <Link
              href="/portal"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/portal"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("tab.board")}
            </Link>
            <Link
              href="/portal/gallery"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/portal/gallery"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("tab.gallery")}
            </Link>
          </div>

          {/* New Request */}
          <Link href="/portal/requests/new">
            {/* Mobile: FAB */}
            <Button
              size="icon"
              className="md:hidden rounded-full h-12 w-12 bg-[#909af7] hover:bg-[#7b85e8] shadow-lg fixed bottom-24 right-4 z-50"
            >
              <PlusSignIcon size={20} color="white" />
            </Button>
            {/* Desktop: button */}
            <Button className="hidden md:flex gap-2 bg-[#909af7] hover:bg-[#7b85e8]">
              <PlusSignIcon size={16} color="white" />
              {t("board.newRequest")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile: Board/Gallery tabs */}
      <div className="flex gap-4 border-b md:hidden">
        <Link
          href="/portal"
          className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${
            pathname === "/portal"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground"
          }`}
        >
          {t("tab.board")}
        </Link>
        <Link
          href="/portal/gallery"
          className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
            pathname === "/portal/gallery"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground"
          }`}
        >
          {t("tab.gallery")}
        </Link>
      </div>

      {/* Mobile: status summary */}
      <div className="flex gap-3 md:hidden text-xs text-muted-foreground">
        {statusColumns.map((col) => {
          const count = requests.filter((r) => r.status === col.key).length;
          if (count === 0) return null;
          return (
            <div key={col.key} className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${col.color}`} />
              <span>{count} {t(col.labelKey)}</span>
            </div>
          );
        })}
      </div>

      {/* What's New banner — tappable to jump to first review request */}
      {showBanner && (() => {
        const firstReviewRequest = reviewReady > 0
          ? requests.find((r) => r.status === "review")
          : null;
        return (
          <div
            className={`bg-[#909af7]/5 border border-[#909af7]/20 rounded-xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-500 ${firstReviewRequest ? "cursor-pointer hover:bg-[#909af7]/10 transition-colors" : ""}`}
            onClick={() => firstReviewRequest && router.push(`/portal/requests/${firstReviewRequest.id}`)}
          >
            <div>
              <p className="text-sm font-medium">{t("board.welcomeBack")}</p>
              <p className="text-xs text-muted-foreground">
                {t("board.sinceLastVisit")}{" "}
                {reviewReady > 0 && t("board.designsReady", { count: reviewReady, s: reviewReady > 1 ? "s" : "" })}
                {reviewReady > 0 && completed > 0 && ", "}
                {completed > 0 && t("board.delivered", { count: completed, s: completed > 1 ? "s" : "" })}
                {reviewReady === 0 && completed === 0 && t("board.updates", { count: totalUpdated, s: totalUpdated > 1 ? "s" : "", es: totalUpdated > 1 ? "es" : "" })}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setBannerDismissed(true); sessionStorage.setItem("banner_dismissed", "true"); }}
              className="text-muted-foreground hover:text-foreground p-1 shrink-0"
            >
              <Cancel01Icon size={16} />
            </button>
          </div>
        );
      })()}

      {/* Desktop: 4-column kanban with drag-and-drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="hidden md:grid grid-cols-4 gap-5 min-h-[50vh]">
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
            <div className="w-16 h-16 rounded-2xl bg-[#909af7]/10 flex items-center justify-center mb-4">
              <PlusSignIcon size={24} className="text-[#909af7]" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{t("board.emptyTitle")}</h2>
            <p className="text-muted-foreground max-w-sm mb-6">
              {t("board.emptyBody")} {t("board.emptyCta")}
            </p>
            <Link href="/portal/requests/new">
              <Button className="gap-2 bg-[#909af7] hover:bg-[#7b85e8]">
                <PlusSignIcon size={16} color="white" />
                {t("board.newRequest")}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
