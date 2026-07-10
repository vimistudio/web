"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CheckmarkCircle01Icon, ArrowRight01Icon } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { fireConfetti } from "@/lib/fire-confetti";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocale } from "./locale-provider";

// --- Types ---

interface DirectionDeliverable {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  url: string | null;
  is_hidden?: boolean;
  direction_label: string | null;
  direction_description: string | null;
  direction_order: number | null;
  is_recommended?: boolean;
  deliverable_events?: {
    id: string;
    deliverable_id: string | null;
    user_id: string;
    event_type: string;
    comment: string | null;
    created_at: string;
    profiles?: { full_name: string | null } | null;
  }[];
}

interface DirectionsVotingProps {
  directions: DirectionDeliverable[];
  currentUserId: string;
  isAdmin: boolean;
  clientName: string;
  requestId: string;
  onVoteComplete?: () => void;
}

// --- Helpers ---

function getExistingVote(
  directions: DirectionDeliverable[],
  userId: string
): { deliverableId: string; comment: string | null } | null {
  for (const d of directions) {
    const vote = d.deliverable_events?.find(
      (e) =>
        e.user_id === userId &&
        (e.event_type === "direction_vote" || e.event_type === "vote")
    );
    if (vote) return { deliverableId: d.id, comment: vote.comment };
  }
  return null;
}

function getVoteCount(d: DirectionDeliverable): number {
  return (
    d.deliverable_events?.filter(
      (e) => e.event_type === "direction_vote" || e.event_type === "vote"
    ).length ?? 0
  );
}

function isVoteEvent(eventType: string): boolean {
  return eventType === "direction_vote" || eventType === "vote";
}

function firstName(name: string | null | undefined, fallback: string): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return fallback;
  return trimmed.split(/\s+/)[0];
}

interface MemberVote {
  userId: string;
  name: string | null;
  deliverableId: string;
  label: string;
  comment: string | null;
  createdAt: string;
}

// Collapse every vote event down to one vote per person (a person can only
// hold one active vote; last event wins). Returns votes keyed by user.
function collectMemberVotes(directions: DirectionDeliverable[]): MemberVote[] {
  const byUser = new Map<string, MemberVote>();
  for (const d of directions) {
    for (const e of d.deliverable_events ?? []) {
      if (!isVoteEvent(e.event_type)) continue;
      byUser.set(e.user_id, {
        userId: e.user_id,
        name: e.profiles?.full_name ?? null,
        deliverableId: d.id,
        label: d.direction_label || d.file_name,
        comment: e.comment,
        createdAt: e.created_at,
      });
    }
  }
  return Array.from(byUser.values());
}

// --- Main Component ---

export function DirectionsVoting({
  directions,
  currentUserId,
  isAdmin,
  clientName,
  requestId,
  onVoteComplete,
}: DirectionsVotingProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { t } = useLocale();

  const sorted = [...directions].sort(
    (a, b) => (a.direction_order ?? 0) - (b.direction_order ?? 0)
  );

  const existingVote = getExistingVote(sorted, currentUserId);
  const [votedId, setVotedId] = useState<string | null>(
    existingVote?.deliverableId ?? null
  );
  const [isConfirmed, setIsConfirmed] = useState(!!existingVote);
  const [pendingVoteId, setPendingVoteId] = useState<string | null>(null);
  const [voteComment, setVoteComment] = useState(existingVote?.comment ?? "");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showOthers, setShowOthers] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const voteButtonRef = useRef<HTMLButtonElement>(null);

  // Track carousel slide changes
  const onApiChange = useCallback((api: CarouselApi) => {
    if (!api) return;
    setCarouselApi(api);
    api.on("select", () => {
      setCurrentSlide(api.selectedScrollSnap());
    });
  }, []);

  // --- Per-member vote attribution (client view) ---
  // Other client members' votes are surfaced as quiet chips on each card, plus
  // a note when the team diverges — per-person votes never overwrite each other.
  const memberVotes = collectMemberVotes(sorted);
  const otherMemberVotes = memberVotes.filter((v) => v.userId !== currentUserId);
  const chipsFor = (deliverableId: string): string[] =>
    otherMemberVotes
      .filter((v) => v.deliverableId === deliverableId)
      .map((v) => t("detail.memberPicked", { name: firstName(v.name, t("detail.someone")) }));

  const distinctChoices = new Set([
    ...otherMemberVotes.map((v) => v.deliverableId),
    ...(votedId ? [votedId] : []),
  ]);
  const divergent = distinctChoices.size > 1;
  const differingOthers = otherMemberVotes.filter((v) =>
    votedId ? v.deliverableId !== votedId : true
  );
  const divergenceNote =
    divergent && differingOthers.length > 0
      ? differingOthers.length === 1
        ? t("detail.memberPickedOther", {
            name: firstName(differingOthers[0].name, t("detail.someone")),
            label: differingOthers[0].label,
          })
        : t("detail.membersPickedDifferent")
      : null;

  const noteBanner = divergenceNote ? (
    <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
      {divergenceNote}
    </div>
  ) : null;

  // --- Vote Flow ---

  const handlePickDirection = useCallback(
    (deliverableId: string) => {
      if (isConfirmed || isAdmin) return;
      setPendingVoteId(deliverableId);
      setVoteComment("");
      setDrawerOpen(true);
    },
    [isConfirmed, isAdmin]
  );

  const handleConfirmVote = useCallback(async () => {
    if (!pendingVoteId || saving) return;
    setSaving(true);

    const supabase = createClient();

    // Remove any existing vote for this request
    if (votedId) {
      await supabase
        .from("deliverable_events")
        .delete()
        .eq("deliverable_id", votedId)
        .eq("user_id", currentUserId)
        .eq("event_type", "direction_vote");
    }

    // Also remove legacy "vote" type events
    for (const d of sorted) {
      await supabase
        .from("deliverable_events")
        .delete()
        .eq("deliverable_id", d.id)
        .eq("user_id", currentUserId)
        .eq("event_type", "vote");
    }

    // Cast new vote
    const { error } = await supabase.from("deliverable_events").insert({
      deliverable_id: pendingVoteId,
      user_id: currentUserId,
      event_type: "direction_vote",
      comment: voteComment.trim() || null,
    });

    if (error) {
      toast.error(t("detail.couldntUpdate"));
      setSaving(false);
      return;
    }

    setVotedId(pendingVoteId);
    setIsConfirmed(true);
    setDrawerOpen(false);
    setSaving(false);

    // Celebration! (fireConfetti gates on prefers-reduced-motion)
    const rect = voteButtonRef.current?.getBoundingClientRect();
    const origin = rect
      ? {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        }
      : { x: 0.5, y: 0.6 };
    fireConfetti({ particleCount: 60, spread: 70, origin });

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    toast.success(t("detail.greatChoice"));

    // Notify admin via email + in-app (fire and forget)
    const votedDirection = sorted.find((d) => d.id === pendingVoteId);
    fetch("/api/portal/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "direction_voted",
        request_id: requestId,
        direction_label: votedDirection?.direction_label || votedDirection?.file_name,
        vote_comment: voteComment.trim() || undefined,
      }),
    }).catch(() => {});

    onVoteComplete?.();
    router.refresh();
  }, [
    pendingVoteId,
    saving,
    votedId,
    currentUserId,
    sorted,
    voteComment,
    requestId,
    onVoteComplete,
    router,
  ]);

  const handleCancelVote = useCallback(() => {
    setPendingVoteId(null);
    setVoteComment("");
    setDrawerOpen(false);
  }, []);

  // --- Admin Vote Summary ---
  if (isAdmin) {
    // Per-person votes (a client team may have several members). Each member's
    // pick is shown with attribution so the studio never loses a vote.
    const memberVotes = collectMemberVotes(sorted);

    if (memberVotes.length > 0) {
      const distinctDirections = new Set(memberVotes.map((v) => v.deliverableId));
      const agree = distinctDirections.size === 1;
      const votesWithComments = memberVotes.filter((v) => v.comment);

      return (
        <div
          className={`rounded-xl p-5 space-y-3 border ${
            agree
              ? "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20"
              : "bg-amber-50 border-amber-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckmarkCircle01Icon
              size={20}
              className={agree ? "text-primary" : "text-amber-600"}
            />
            {agree ? (
              <p className="font-semibold text-sm">
                {memberVotes.map((v) => firstName(v.name, clientName)).join(", ")}{" "}
                {t("detail.picked")}{" "}
                <span className="text-primary">{memberVotes[0].label}</span>
              </p>
            ) : (
              <p className="font-semibold text-sm text-amber-900">
                {memberVotes
                  .map((v) => `${firstName(v.name, t("detail.someone"))} → ${v.label}`)
                  .join(" · ")}
              </p>
            )}
          </div>
          {!agree && (
            <p className="text-xs font-medium text-amber-700 ml-7">
              {t("detail.membersDisagree")}
            </p>
          )}
          {votesWithComments.map((v) => (
            <p key={v.userId} className="text-sm text-muted-foreground ml-7 italic">
              {firstName(v.name, clientName)}: &ldquo;{v.comment}&rdquo;
            </p>
          ))}
        </div>
      );
    }

    // No vote yet — show waiting state
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center space-y-1">
        <p className="font-medium text-sm text-amber-900">
          {t("detail.waitingForPick")}
        </p>
        <p className="text-xs text-amber-700">
          {sorted.length} {sorted.length === 1 ? "direction" : "directions"}
        </p>
      </div>
    );
  }

  // --- Post-Vote (Client confirmed) ---
  if (isConfirmed && votedId) {
    const winner = sorted.find((d) => d.id === votedId);
    const others = sorted.filter((d) => d.id !== votedId);
    const isImage = winner?.mime_type?.startsWith("image/");

    return (
      <div className="space-y-4">
        {noteBanner}

        {/* Winner hero */}
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">{t("detail.greatChoice")}</p>
          <p className="text-sm text-muted-foreground">
            {t("detail.willRefine")}
          </p>
        </div>

        {winner && (
          <Card className="ring-2 ring-primary shadow-md overflow-hidden">
            {isImage && winner.url && (
              <div className="aspect-[4/3] bg-muted">
                <img
                  src={winner.url}
                  alt={winner.direction_label || winner.file_name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-base">
                  {winner.direction_label || winner.file_name}
                </p>
                <Badge className="bg-primary text-white text-[10px]">
                  {t("detail.yourPick")}
                </Badge>
              </div>
              {winner.direction_description && (
                <p className="text-sm text-muted-foreground">
                  {winner.direction_description}
                </p>
              )}
              {voteComment && (
                <p className="text-sm text-muted-foreground italic mt-2">
                  &ldquo;{voteComment}&rdquo;
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Other directions — collapsible */}
        {others.length > 0 && (
          <Collapsible open={showOthers} onOpenChange={setShowOthers}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center py-1"
              >
                {showOthers
                  ? t("detail.hideOthers")
                  : t("detail.seeOthers")}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {others.map((d) => {
                  const isImg = d.mime_type?.startsWith("image/");
                  return (
                    <Card key={d.id} className="opacity-40 overflow-hidden">
                      {isImg && d.url && (
                        <div className="aspect-[4/3] bg-muted">
                          <img
                            src={d.url}
                            alt={d.direction_label || d.file_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardContent className="p-2">
                        <p className="text-xs font-medium truncate">
                          {d.direction_label || d.file_name}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    );
  }

  // --- Voting UI (Client hasn't voted yet) ---

  const pendingDirection = sorted.find((d) => d.id === pendingVoteId);

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-5 text-center space-y-1">
        <p className="font-semibold text-base">{t("detail.pickFavorite")}</p>
        <p className="text-sm text-muted-foreground">
          {t("detail.pickSub")}
        </p>
      </div>

      {noteBanner}

      {/* Carousel (mobile) or Grid (desktop) */}
      {isMobile ? (
        <div className="space-y-3">
          <Carousel
            opts={{ align: "center", containScroll: "trimSnaps" }}
            setApi={onApiChange}
            className="w-full"
            aria-label={t("detail.pickFavorite")}
          >
            <CarouselContent>
              {sorted.map((d) => (
                <CarouselItem key={d.id} className="basis-full">
                  <DirectionCard
                    direction={d}
                    onPick={() => handlePickDirection(d.id)}
                    isPending={pendingVoteId === d.id}
                    disabled={isConfirmed}
                    chips={chipsFor(d.id)}
                    ref={pendingVoteId === d.id ? voteButtonRef : undefined}
                    labels={{
                      pickThis: t("detail.pickThis"),
                      thisOne: t("detail.thisOne"),
                      designersPick: t("detail.designersPick"),
                    }}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Dot indicators */}
          <div className="flex justify-center gap-1.5">
            {sorted.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => carouselApi?.scrollTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentSlide
                    ? "w-6 bg-primary"
                    : "w-2 bg-muted-foreground/30"
                }`}
                aria-label={`Go to direction ${i + 1}`}
              />
            ))}
          </div>
        </div>
      ) : (
        <div
          className={`grid gap-4 ${
            sorted.length === 2
              ? "grid-cols-2"
              : sorted.length === 3
                ? "grid-cols-3"
                : "grid-cols-2"
          }`}
        >
          {sorted.map((d) => (
            <DirectionCard
              key={d.id}
              direction={d}
              onPick={() => handlePickDirection(d.id)}
              isPending={pendingVoteId === d.id}
              disabled={isConfirmed}
              chips={chipsFor(d.id)}
              labels={{
                pickThis: t("detail.pickThis"),
                thisOne: t("detail.thisOne"),
                designersPick: t("detail.designersPick"),
              }}
            />
          ))}
        </div>
      )}

      {/* Vote Confirmation Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader className="text-center">
            {pendingDirection?.url &&
              pendingDirection.mime_type?.startsWith("image/") && (
                <div className="w-20 h-20 rounded-lg overflow-hidden mx-auto mb-2 bg-muted">
                  <img
                    src={pendingDirection.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            <DrawerTitle>
              {t("detail.greatChoice")} {pendingDirection?.direction_label || pendingDirection?.file_name}
            </DrawerTitle>
            <DrawerDescription>
              {t("detail.addNote")}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4">
            <Textarea
              value={voteComment}
              onChange={(e) => setVoteComment(e.target.value)}
              placeholder={t("detail.tellDesigner")}
              className="resize-none"
              rows={2}
            />
          </div>

          <DrawerFooter>
            <Button
              onClick={handleConfirmVote}
              disabled={saving}
              className="h-14 text-base font-semibold bg-primary hover:bg-primary/90 active:scale-95 transition-all"
            >
              {saving ? t("detail.confirming") : t("detail.confirmVote")}
            </Button>
            <DrawerClose asChild>
              <Button
                variant="ghost"
                onClick={handleCancelVote}
                className="text-muted-foreground"
              >
                {t("detail.changeMyMind")}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

// --- Direction Card ---

import { forwardRef } from "react";

const DirectionCard = forwardRef<
  HTMLButtonElement,
  {
    direction: DirectionDeliverable;
    onPick: () => void;
    isPending: boolean;
    disabled: boolean;
    chips?: string[];
    labels: {
      pickThis: string;
      thisOne: string;
      designersPick: string;
    };
  }
>(function DirectionCard({ direction, onPick, isPending, disabled, chips = [], labels }, ref) {
  const isImage = direction.mime_type?.startsWith("image/");
  const voteCount = getVoteCount(direction);

  return (
    <Card className="overflow-hidden">
      {/* Thumbnail */}
      {isImage && direction.url ? (
        <div className="aspect-[4/3] bg-muted relative">
          <img
            src={direction.url}
            alt={direction.direction_label || direction.file_name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {direction.is_recommended && (
            <Badge className="absolute top-2 right-2 bg-primary/90 text-white text-[10px] backdrop-blur-sm">
              {labels.designersPick}
            </Badge>
          )}
        </div>
      ) : (
        <div className="aspect-[4/3] bg-muted flex items-center justify-center relative">
          <span className="text-2xl text-muted-foreground font-medium">
            {direction.file_name.split(".").pop()?.toUpperCase()}
          </span>
          {direction.is_recommended && (
            <Badge className="absolute top-2 right-2 bg-primary/90 text-white text-[10px] backdrop-blur-sm">
              {labels.designersPick}
            </Badge>
          )}
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        {/* Label + Description */}
        <div className="space-y-0.5">
          <p className="font-semibold text-base leading-tight">
            {direction.direction_label || direction.file_name}
          </p>
          {direction.direction_description && (
            <p className="text-sm text-muted-foreground">
              {direction.direction_description}
            </p>
          )}
        </div>

        {/* Vote count (if any) */}
        {voteCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {voteCount} {voteCount === 1 ? "pick" : "picks"}
          </p>
        )}

        {/* Other members' picks — attributed chips */}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium px-2 py-0.5"
              >
                <CheckmarkCircle01Icon size={11} />
                {chip}
              </span>
            ))}
          </div>
        )}

        {/* Pick Button — Fitts's Law: full width, 56px tall */}
        {!disabled && (
          <Button
            ref={ref}
            onClick={onPick}
            variant={isPending ? "default" : "outline"}
            aria-label={`${labels.pickThis}: ${direction.direction_label || direction.file_name}`}
            className={`w-full h-14 text-base font-semibold transition-all active:scale-95 ${
              isPending
                ? "bg-primary hover:bg-primary/90 text-white"
                : "hover:border-primary hover:text-primary"
            }`}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <CheckmarkCircle01Icon size={18} />
                {labels.thisOne}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {labels.pickThis}
              </span>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
});
