"use client";

import { useState, useRef, useEffect, useCallback, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft01Icon,
  CalendarIcon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  SentIcon,
  Download01Icon,
  Upload01Icon,
  ViewIcon,
  PlusSignIcon,
} from "@/components/ui/icons";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { fireConfetti } from "@/lib/fire-confetti";
import { sanitizeFileName } from "@/lib/files";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useRealtime } from "@/hooks/use-realtime";
import { ImageLightbox } from "@/components/portal/image-lightbox";
import { Input } from "@/components/ui/input";
import { useLocale } from "./locale-provider";
import { type PortalKey, type Locale } from "@/lib/portal-i18n";
import { InstagramCarouselPreview } from "./social/instagram-carousel-preview";
import { DirectionOrganizer } from "./admin/direction-organizer";
import { DirectionsVoting } from "./directions-voting";
import { AssigneeMenu, type Admin } from "./assignee-control";

// --- Types ---

interface Comment {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  attachment_url?: string | null;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    role?: string | null;
  } | null;
}

interface DeliverableEvent {
  id: string;
  deliverable_id: string | null;
  user_id: string;
  event_type: string;
  comment: string | null;
  created_at: string;
  profiles?: { full_name: string | null } | null;
}

interface Deliverable {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  url: string | null;
  is_hidden?: boolean;
  tags?: string[];
  direction_label?: string | null;
  direction_description?: string | null;
  direction_order?: number | null;
  is_recommended?: boolean;
  deliverable_events?: DeliverableEvent[];
}

interface Request {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: "queued" | "in_progress" | "review" | "done";
  priority: number;
  created_at: string;
  updated_at: string;
  due_date: string | null;
  client_id: string;
  assignee_id: string | null;
  voting_mode?: string | null;
  clients: { name: string; slug: string } | null;
  deliverables: Deliverable[];
  reference_images: Deliverable[];
  comments: Comment[];
}

interface ActivityEntry {
  id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  actor_id: string | null;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
}

interface SocialPost {
  id: string;
  ig_handle: string | null;
  ig_caption: string | null;
  status: string;
  tags?: string[];
  is_hidden?: boolean;
  direction_label?: string | null;
  direction_description?: string | null;
  direction_order?: number | null;
  is_recommended?: boolean;
  social_slides: {
    id: string;
    slide_order: number;
    image_path: string | null;
    alt_text: string | null;
    url: string | null;
  }[];
  deliverable_events?: {
    id: string;
    social_post_id: string | null;
    user_id: string;
    event_type: string;
    comment: string | null;
    created_at: string;
  }[];
}

interface RequestDetailProps {
  request: Request;
  clientName: string;
  creatorName?: string | null;
  assigneeName?: string | null;
  queuePosition?: number | null;
  memberCount?: number;
  currentUserId: string;
  isAdmin: boolean;
  isImpersonating: boolean;
  activityLog?: ActivityEntry[];
  socialPosts?: SocialPost[];
  admins?: Admin[];
}

// --- Carousel Tag Input (small, for admin) ---

function CarouselTagInput({ onAdd }: { onAdd: (tag: string) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-[10px] px-2 py-0.5 rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground hover:text-foreground hover:border-foreground/60"
      >
        + tag
      </button>
    );
  }
  return (
    <input
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        const v = value.trim();
        if (v) onAdd(v);
        setValue("");
        setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          const v = value.trim();
          if (v) onAdd(v);
          setValue("");
          setOpen(false);
        } else if (e.key === "Escape") {
          setValue("");
          setOpen(false);
        }
      }}
      placeholder="tag…"
      maxLength={20}
      className="text-[10px] px-2 py-0.5 rounded-full bg-muted border-none outline-none w-20"
    />
  );
}

// --- Comment Body with Video Embeds ---

const LOOM_REGEX = /https?:\/\/(?:www\.)?loom\.com\/share\/([a-zA-Z0-9]+)(?:\?[^\s]*)?/g;
const YOUTUBE_REGEX = /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)(?:[^\s]*)?/g;

function CommentBody({ body, mine = false }: { body: string; mine?: boolean }) {
  const loomMatches = Array.from(body.matchAll(LOOM_REGEX));
  const youtubeMatches = Array.from(body.matchAll(YOUTUBE_REGEX));

  // Strip video URLs from the text body so they don't show as raw links too
  let textBody = body;
  for (const m of loomMatches) textBody = textBody.replace(m[0], "");
  for (const m of youtubeMatches) textBody = textBody.replace(m[0], "");
  textBody = textBody.trim();

  return (
    <div className="space-y-2">
      {textBody && (
        <p
          className="text-sm whitespace-pre-wrap"
          style={{ color: mine ? "#F6F4EF" : "#3A3843" }}
        >
          {textBody}
        </p>
      )}
      {loomMatches.map((m, i) => (
        <div key={`loom-${i}`} className="mt-2 rounded-lg overflow-hidden border bg-black/5">
          <iframe
            src={`https://www.loom.com/embed/${m[1]}`}
            allowFullScreen
            className="w-full aspect-video"
            title="Loom video"
          />
        </div>
      ))}
      {youtubeMatches.map((m, i) => (
        <div key={`yt-${i}`} className="mt-2 rounded-lg overflow-hidden border bg-black/5">
          <iframe
            src={`https://www.youtube.com/embed/${m[1]}`}
            allowFullScreen
            className="w-full aspect-video"
            title="YouTube video"
          />
        </div>
      ))}
    </div>
  );
}

// --- Config ---

const statusSteps = [
  { key: "queued", label: "Up Next" },
  { key: "in_progress", label: "In Progress" },
  { key: "review", label: "Ready for You" },
  { key: "done", label: "Delivered" },
] as const;

const statusConfig: Record<string, { label: string; color: string }> = {
  queued: { label: "Up Next", color: "bg-gray-100 text-gray-700" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  review: { label: "Ready for You", color: "bg-amber-100 text-amber-700" },
  done: { label: "Delivered", color: "bg-emerald-100 text-emerald-700" },
};

const priorityLabels: Record<number, { labelKey: string; color: string }> = {
  1: { labelKey: "form.priority.whenever", color: "text-gray-500" },
  2: { labelKey: "form.priority.thisWeek", color: "text-amber-600" },
  3: { labelKey: "form.priority.urgent", color: "text-red-600" },
};

const typeLabels: Record<string, string> = {
  logo: "Logo Design",
  social: "Social Media",
  web: "Website",
  brand: "Branding",
  presentation: "Presentation",
  other: "Other",
};

// Priority badge backgrounds (v2 header card) — mirror the existing priority
// palette: whenever/gray, this-week/blue, urgent/red.
const priorityBadgeColors: Record<number, string> = {
  1: "bg-gray-100 text-gray-600",
  2: "bg-[#E8EDFB] text-[#3554A8]",
  3: "bg-red-100 text-red-600",
};

const typeColors: Record<string, string> = {
  logo: "bg-purple-100 text-purple-700",
  social: "bg-pink-100 text-pink-700",
  web: "bg-blue-100 text-blue-700",
  brand: "bg-amber-100 text-amber-700",
  presentation: "bg-emerald-100 text-emerald-700",
  other: "bg-gray-100 text-gray-700",
};

// --- Sub-components ---

// Goal-gradient stepper — dots + filling bars on one centerline via CSS grid.
// Progress is purely a function of `currentStatus`; bars fill with the
// per-client accent (done = 100%, current = partial, future = empty).
function ProgressStepper({
  currentStatus,
  t,
}: {
  currentStatus: string;
  t: (key: PortalKey, vars?: Record<string, string | number>) => string;
}) {
  const currentIndex = statusSteps.findIndex((s) => s.key === currentStatus);
  // "auto 1fr auto 1fr auto 1fr auto" — dot columns are auto, bars stretch.
  const gridTemplateColumns = statusSteps.map(() => "auto").join(" 1fr ");

  return (
    <div
      className="grid items-center gap-y-2 py-1"
      style={{ gridTemplateColumns }}
      role="list"
      aria-label={t(`status.${currentStatus}` as PortalKey)}
    >
      {/* Row 1 — dots + connecting bars */}
      {statusSteps.map((step, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        return (
          <Fragment key={step.key}>
            <div
              className="relative flex h-8 w-8 items-center justify-center"
              role="listitem"
              aria-current={current ? "step" : undefined}
            >
              {current && (
                <span
                  aria-hidden
                  className="vm-pulse absolute inset-0 rounded-full"
                  style={{ background: "var(--accent)" }}
                />
              )}
              <div
                className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold transition-all duration-300"
                style={
                  done
                    ? { background: "var(--status-done)", color: "#fff" }
                    : current
                      ? { background: "var(--accent)", color: "var(--accent-foreground)" }
                      : {
                          background: "#fff",
                          color: "var(--vimi-faint)",
                          border: "1.5px solid var(--vimi-border)",
                        }
                }
              >
                {done ? <CheckmarkCircle01Icon size={16} /> : i + 1}
              </div>
            </div>
            {i < statusSteps.length - 1 && (
              <div
                className="h-[3px] rounded-full"
                style={{ background: "var(--vimi-border)" }}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{
                    width: done ? "100%" : current ? "35%" : "0%",
                    background: "var(--accent)",
                  }}
                />
              </div>
            )}
          </Fragment>
        );
      })}

      {/* Row 2 — labels aligned under each dot */}
      {statusSteps.map((step, i) => {
        const current = i === currentIndex;
        return (
          <Fragment key={`${step.key}-label`}>
            <span
              className={`text-center text-[10px] leading-tight sm:text-[11px] ${
                current
                  ? "font-bold text-[color:var(--vimi-ink)]"
                  : "font-medium text-[color:var(--vimi-faint)]"
              }`}
            >
              {t(`status.${step.key}` as PortalKey)}
            </span>
            {i < statusSteps.length - 1 && <span aria-hidden />}
          </Fragment>
        );
      })}
    </div>
  );
}

function CompletionBanner({
  updatedAt,
  locale,
  t,
  onDownloadAll,
  canDownloadAll,
}: {
  updatedAt: string;
  locale: Locale;
  t: (key: PortalKey, vars?: Record<string, string | number>) => string;
  onDownloadAll?: () => void;
  canDownloadAll?: boolean;
}) {
  const date = new Date(updatedAt).toLocaleDateString(
    locale === "es" ? "es-ES" : "en-US",
    { month: "long", day: "numeric", year: "numeric" }
  );
  return (
    <div
      className="vm-rise flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center"
      style={{ background: "#E9F4EE", border: "1px solid rgba(46,139,87,0.35)" }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
        style={{ background: "var(--status-done)" }}
      >
        <CheckmarkCircle01Icon size={20} color="currentColor" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[color:var(--vimi-ink)]">
          {t("detail.doneBannerTitle", { date })}
        </p>
        <p className="mt-0.5 text-[13px] text-[color:var(--vimi-muted)]">
          {t("detail.doneBannerSub")}
        </p>
      </div>
      {canDownloadAll && onDownloadAll && (
        <button
          onClick={onDownloadAll}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 active:scale-95"
          style={{ background: "var(--status-done)" }}
        >
          <Download01Icon size={15} color="currentColor" />
          {t("detail.downloadAll")}
        </button>
      )}
    </div>
  );
}

function DeliverableCard({
  d,
  isAdmin,
  onImageClick,
  onDelete,
  onToggleHidden,
  onUpdateTags,
  onDownload,
  onVote,
  isVoted,
  voteLabel,
  downloadErrorLabel,
}: {
  d: Deliverable;
  isAdmin: boolean;
  onImageClick?: () => void;
  onDelete?: () => void;
  onToggleHidden?: () => void;
  onUpdateTags?: (tags: string[]) => void;
  onDownload?: () => void;
  onVote?: () => void;
  isVoted?: boolean;
  voteLabel?: string;
  downloadErrorLabel?: string;
}) {
  const isImage = d.mime_type?.startsWith("image/");
  const [loaded, setLoaded] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const tags = d.tags ?? [];
  const events = d.deliverable_events ?? [];
  const viewCount = events.filter((e) => e.event_type === "view").length;
  const downloadCount = events.filter((e) => e.event_type === "download").length;

  // Stats (views/downloads + viewer list) are admin-only — clients shouldn't see
  // who viewed their own deliverables nor download tallies on their own files.
  const statsSection = isAdmin && events.length > 0 ? (
    <div className="relative mt-1">
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setShowViewers(!showViewers); }}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ViewIcon size={12} />
          {viewCount}
        </button>
        <span className="flex items-center gap-1">
          <Download01Icon size={12} />
          {downloadCount}
        </span>
      </div>
      {showViewers && events.length > 0 && (
        <>
          {/* Click-outside overlay to close */}
          <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowViewers(false); }} />
          <div
            className="absolute z-20 bottom-full mb-1 left-0 bg-background border border-border rounded-lg shadow-lg p-2 min-w-[200px]"
            onClick={(e) => e.stopPropagation()}
          >
            {events
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 10)
              .map((ev) => (
                <p key={ev.id} className="text-[11px] text-muted-foreground py-0.5">
                  {ev.profiles?.full_name ?? "Someone"}{" "}
                  {ev.event_type === "view" ? "viewed" : "downloaded"} on{" "}
                  {new Date(ev.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </p>
              ))}
          </div>
        </>
      )}
    </div>
  ) : null;

  const voteSection = onVote ? (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onVote();
      }}
      className={`mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
        isVoted
          ? "text-red-500"
          : "text-muted-foreground hover:text-red-400"
      }`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill={isVoted ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {voteLabel}
    </button>
  ) : null;

  const tagSection = (tags.length > 0 || onUpdateTags) ? (
    <div className="flex flex-wrap items-center gap-1 mt-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded"
        >
          {tag}
          {onUpdateTags && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateTags(tags.filter((t) => t !== tag));
              }}
              className="ml-0.5 hover:text-red-500"
            >
              ×
            </button>
          )}
        </span>
      ))}
      {onUpdateTags && !showTagInput && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowTagInput(true);
          }}
          className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground px-1 py-0.5 rounded hover:bg-gray-100 transition-colors"
        >
          + tag
        </button>
      )}
      {onUpdateTags && showTagInput && (
        <input
          autoFocus
          type="text"
          value={tagInput}
          placeholder="e.g. final"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter" && tagInput.trim()) {
              const newTag = tagInput.trim().toLowerCase();
              onUpdateTags(tags.includes(newTag) ? tags : [...tags, newTag]);
              setTagInput("");
              setShowTagInput(false);
            }
            if (e.key === "Escape") {
              setTagInput("");
              setShowTagInput(false);
            }
          }}
          onBlur={() => {
            if (tagInput.trim()) {
              const newTag = tagInput.trim().toLowerCase();
              onUpdateTags(tags.includes(newTag) ? tags : [...tags, newTag]);
            }
            setTagInput("");
            setShowTagInput(false);
          }}
          className="text-[10px] w-16 px-1 py-0.5 border border-gray-200 rounded outline-none focus:border-primary"
        />
      )}
    </div>
  ) : null;

  const adminActions = (onDelete || onToggleHidden) ? (
    <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
      {onToggleHidden && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleHidden();
          }}
          className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
            d.is_hidden
              ? "bg-amber-500 text-white"
              : "bg-black/60 hover:bg-amber-500 text-white"
          }`}
          aria-label={d.is_hidden ? "Show to client" : "Hide from client"}
          title={d.is_hidden ? "Show to client" : "Hide from client"}
        >
          <ViewIcon size={12} />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="w-6 h-6 rounded-full bg-black/60 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
          aria-label="Delete file"
        >
          <Cancel01Icon size={12} />
        </button>
      )}
    </div>
  ) : null;

  if (isImage && d.url) {
    return (
      <button
        type="button"
        onClick={onImageClick}
        className="block w-full text-left"
      >
        <div className={`group relative overflow-hidden rounded-[18px] border border-[color:var(--vimi-border)] bg-white shadow-[0_2px_8px_rgba(28,27,31,0.05)] transition-shadow hover:shadow-[0_6px_18px_rgba(28,27,31,0.10)] ${d.is_hidden ? "opacity-50 ring-2 ring-amber-300 ring-dashed" : ""}`}>
          {adminActions}
          {d.is_hidden && (
            <div className="absolute top-8 left-2 z-10 bg-amber-100 text-amber-700 text-[10px] font-medium px-1.5 py-0.5 rounded">
              Hidden
            </div>
          )}
          <div className="aspect-[4/3] bg-[#FBFAF8] relative">
            {!loaded && (
              <div className="vm-shimmer absolute inset-0" />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={d.url}
              alt={d.file_name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
              loading="lazy"
              onLoad={() => setLoaded(true)}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                <Download01Icon size={16} className="text-gray-700" />
              </div>
            </div>
          </div>
          <div className="p-2.5">
            <p className="text-xs font-medium truncate text-[color:var(--vimi-ink)]">{d.file_name}</p>
            <p className="text-[10px] text-[color:var(--vimi-muted)]">
              {[
                d.mime_type?.split("/")[1]?.toUpperCase(),
                d.file_size ? `${(d.file_size / 1024).toFixed(0)} KB` : null,
                new Date(d.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
              ].filter(Boolean).join(" · ")}
            </p>
            {tagSection}
            {voteSection}
            {statsSection}
          </div>
        </div>
      </button>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={`block w-full text-left cursor-pointer ${!d.url ? "pointer-events-none opacity-50" : ""}`}
      onClick={async () => {
        if (!d.url) return;
        try {
          const res = await fetch(d.url);
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = d.file_name;
          a.click();
          URL.revokeObjectURL(url);
          onDownload?.();
        } catch {
          toast.error(downloadErrorLabel ?? "Couldn't download file");
        }
      }}
    >
      <div className={`group relative overflow-hidden rounded-[18px] border border-[color:var(--vimi-border)] bg-white shadow-[0_2px_8px_rgba(28,27,31,0.05)] transition-shadow hover:shadow-[0_6px_18px_rgba(28,27,31,0.10)] ${d.is_hidden ? "opacity-50 ring-2 ring-amber-300 ring-dashed" : ""}`}>
        {adminActions}
        <div className="p-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-[color:var(--vimi-ink)]">
                {d.file_name}
              </p>
              <p className="text-xs text-[color:var(--vimi-muted)]">
                {[
                  d.mime_type?.split("/")[1]?.toUpperCase(),
                  d.file_size ? `${(d.file_size / 1024 / 1024).toFixed(1)} MB` : null,
                  new Date(d.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
                ].filter(Boolean).join(" · ")}
              </p>
            </div>
            <Download01Icon size={16} className="text-[color:var(--vimi-faint)] shrink-0" />
          </div>
          {tagSection}
          {voteSection}
        </div>
      </div>
    </div>
  );
}

const activityConfig: Record<string, { label: (oldVal: string | null, newVal: string | null, actor: string) => string; dot: string }> = {
  status_changed: {
    label: (oldVal, newVal, actor) => {
      const to = statusConfig[newVal ?? ""]?.label ?? newVal;
      return `${actor} moved to ${to}`;
    },
    dot: "bg-blue-500",
  },
  comment_added: {
    label: (_o, _n, actor) => `${actor} commented`,
    dot: "bg-primary",
  },
  deliverable_uploaded: {
    label: (_o, newVal, actor) => `${actor} uploaded ${newVal ?? "a file"}`,
    dot: "bg-emerald-500",
  },
};

const ACTIVITY_COLLAPSED_COUNT = 5;

function ActivityTimeline({ entries, locale }: { entries: ActivityEntry[]; locale: Locale }) {
  const [expanded, setExpanded] = useState(false);
  const dfnsLocale = locale === "es" ? es : undefined;

  if (entries.length === 0) return null;

  // Entries arrive in chronological order (oldest first). We collapse the
  // OLDER ones so the user sees the most recent activity by default —
  // "Show N earlier" button at the top restores full history.
  const totalHidden =
    !expanded && entries.length > ACTIVITY_COLLAPSED_COUNT
      ? entries.length - ACTIVITY_COLLAPSED_COUNT
      : 0;
  const visibleEntries = totalHidden > 0 ? entries.slice(-ACTIVITY_COLLAPSED_COUNT) : entries;

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium">Activity</h2>
      <div className="relative pl-5 space-y-3">
        <div className="absolute left-[7px] top-1 bottom-1 w-px bg-muted-foreground/15" />

        {totalHidden > 0 && (
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center gap-3 relative text-xs text-muted-foreground hover:text-foreground transition-colors group"
          >
            <span className="absolute left-[-14px] top-1.5 w-2 h-2 rounded-full border border-muted-foreground/30 bg-background group-hover:border-foreground/60" />
            Show {totalHidden} earlier {totalHidden === 1 ? "item" : "items"}
          </button>
        )}

        {visibleEntries.map((entry) => {
          const actor = entry.profiles?.full_name ?? "Someone";
          const config = activityConfig[entry.action];
          const label = config
            ? config.label(entry.old_value, entry.new_value, actor)
            : `${actor} ${entry.action}`;
          const dotColor = config?.dot ?? "bg-gray-400";
          const absoluteTimestamp = new Date(entry.created_at).toLocaleString();

          return (
            <div key={entry.id} className="flex items-start gap-3 relative">
              <div className={`absolute left-[-14px] top-1.5 w-2 h-2 rounded-full ${dotColor}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p
                  className="text-[10px] text-muted-foreground/60"
                  title={absoluteTimestamp}
                >
                  {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: dfnsLocale })}
                </p>
              </div>
            </div>
          );
        })}

        {expanded && entries.length > ACTIVITY_COLLAPSED_COUNT && (
          <button
            onClick={() => setExpanded(false)}
            className="flex items-center gap-3 relative text-xs text-muted-foreground hover:text-foreground transition-colors group"
          >
            <span className="absolute left-[-14px] top-1.5 w-2 h-2 rounded-full border border-muted-foreground/30 bg-background group-hover:border-foreground/60" />
            Collapse earlier activity
          </button>
        )}
      </div>
    </div>
  );
}

// --- Main component ---

export function RequestDetail({
  request,
  clientName,
  creatorName = null,
  assigneeName = null,
  queuePosition = null,
  memberCount = 1,
  currentUserId,
  isAdmin,
  isImpersonating,
  activityLog = [],
  socialPosts = [],
  admins = [],
}: RequestDetailProps) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(request.status);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [optimisticComments, setOptimisticComments] = useState<Comment[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [commentAttachment, setCommentAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const commentFileRef = useRef<HTMLInputElement>(null);

  // Edit mode state (only when queued)
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(request.title);
  const [editDescription, setEditDescription] = useState(request.description ?? "");
  const [editType, setEditType] = useState<string>(request.type);
  const [editPriority, setEditPriority] = useState(request.priority);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Peak-End celebration (client approves a delivery)
  const [showCelebration, setShowCelebration] = useState(false);
  const [doneCount, setDoneCount] = useState<number | null>(null);
  const [rating, setRating] = useState(0);
  const { t, locale } = useLocale();

  const canEdit = currentStatus === "queued" && !isAdmin;

  // Directions mode — check if any deliverable has direction_label set
  const hasDirections = request.deliverables.some((d) => d.direction_label);

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || isSavingEdit) return;
    setIsSavingEdit(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("requests")
      .update({
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        type: editType as "logo" | "social" | "web" | "brand" | "presentation" | "other",
        priority: editPriority,
      })
      .eq("id", request.id);
    setIsSavingEdit(false);
    if (error) {
      toast.error("Could not save changes");
      return;
    }
    toast.success(t("edit.saved"));
    setIsEditing(false);
    router.refresh();
  };

  const handleCancelEdit = () => {
    setEditTitle(request.title);
    setEditDescription(request.description ?? "");
    setEditType(request.type);
    setEditPriority(request.priority);
    setIsEditing(false);
  };

  const allComments = [...request.comments, ...optimisticComments];

  // Carousel publishes create a placeholder deliverable file with this mime —
  // those should NOT show up in "Your Designs" (the carousel block already
  // renders them) nor count toward the deliverables-direction-organizer.
  const realDeliverables = request.deliverables.filter(
    (d) => d.mime_type !== "application/vnd.vimi.social-post"
  );

  // Build image list for lightbox (only visible image deliverables with URLs)
  const visibleDeliverables = realDeliverables.filter(
    (d) => isAdmin || !d.is_hidden
  );
  const lightboxImages = visibleDeliverables
    .filter((d) => d.mime_type?.startsWith("image/") && d.url)
    .map((d) => ({
      url: d.url!,
      fileName: d.file_name,
      fileSize: d.file_size,
      mimeType: d.mime_type,
    }));

  const backHref = isImpersonating
    ? "/portal"
    : isAdmin
      ? `/portal/admin/clients/${request.clients?.slug ?? ""}`
      : "/portal";

  const priority = priorityLabels[request.priority];
  const requestedDate = new Date(request.created_at).toLocaleDateString(
    undefined,
    { month: "short", day: "numeric", year: "numeric" }
  );
  const dfnsLocale = locale === "es" ? es : undefined;
  const updatedDate = formatDistanceToNow(new Date(request.updated_at), {
    addSuffix: true,
    locale: dfnsLocale,
  });

  const firstName = (full: string | null) =>
    full ? full.trim().split(/\s+/)[0] : null;
  // Designer for the conversation/queue copy: real assignee name, else neutral.
  const designerName = firstName(assigneeName) ?? t("detail.queueDesignerFallback");
  // Composer counterpart: admins message the client, clients message the designer.
  const composerPartner = isAdmin
    ? firstName(clientName) ?? clientName
    : designerName;
  const showCreator = memberCount >= 2 && !!creatorName;
  const dueDateShort = request.due_date
    ? new Date(request.due_date).toLocaleDateString(
        locale === "es" ? "es-ES" : "en-US",
        { month: "short", day: "numeric" }
      )
    : null;
  const dueDateLong = request.due_date
    ? new Date(request.due_date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  // Review header meta line — real delivered date + visible file count.
  const reviewMeta = (() => {
    if (visibleDeliverables.length === 0) return null;
    const latest = visibleDeliverables.reduce((acc, d) =>
      new Date(d.created_at) > new Date(acc.created_at) ? d : acc
    );
    const when = new Date(latest.created_at).toLocaleDateString(
      locale === "es" ? "es-ES" : "en-US",
      { month: "short", day: "numeric" }
    );
    const n = visibleDeliverables.length;
    return `${t("detail.deliveredOn")} ${when} · ${n} ${n === 1 ? t("gallery.deliverable") : t("gallery.deliverables")}`;
  })();

  // Clear optimistic comments when server data updates
  useEffect(() => {
    setOptimisticComments([]);
  }, [request.comments.length]);

  const handleSubmitComment = useCallback(async () => {
    if ((!comment.trim() && !commentAttachment) || isSubmitting) return;
    setIsSubmitting(true);

    const optimisticComment: Comment = {
      id: `optimistic-${Date.now()}`,
      body: comment.trim(),
      created_at: new Date().toISOString(),
      author_id: currentUserId,
      attachment_path: null,
      attachment_name: commentAttachment?.name ?? null,
      attachment_type: commentAttachment?.type ?? null,
      attachment_url: attachmentPreview,
      profiles: { full_name: "You", avatar_url: null, role: isAdmin ? "admin" : "client" },
    };
    setOptimisticComments((prev) => [...prev, optimisticComment]);
    const commentText = comment.trim();
    const file = commentAttachment;
    setComment("");
    setCommentAttachment(null);
    setAttachmentPreview(null);
    if (commentInputRef.current) commentInputRef.current.style.height = "auto";

    const supabase = createClient();

    // Upload attachment if present
    let attachmentPath: string | null = null;
    let attachmentName: string | null = null;
    let attachmentType: string | null = null;
    if (file) {
      const filePath = `${request.client_id}/${request.id}/comments/${Date.now()}-${sanitizeFileName(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("references")
        .upload(filePath, file);
      if (!uploadError) {
        attachmentPath = filePath;
        attachmentName = file.name;
        attachmentType = file.type;
      }
    }

    const { error } = await supabase.from("comments").insert({
      request_id: request.id,
      author_id: currentUserId,
      body: commentText || (attachmentName ? `Attached ${attachmentName}` : ""),
      attachment_path: attachmentPath,
      attachment_name: attachmentName,
      attachment_type: attachmentType,
    });

    if (error) {
      toast.error(t("detail.couldntPost"));
      setOptimisticComments((prev) =>
        prev.filter((c) => c.id !== optimisticComment.id)
      );
      setComment(commentText);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    router.refresh();

    fetch("/api/portal/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "comment_added", request_id: request.id }),
    }).catch(() => {});
  }, [comment, commentAttachment, attachmentPreview, isSubmitting, currentUserId, isAdmin, request.id, request.client_id, router]);

  const handleStatusChange = useCallback(
    async (newStatus: "queued" | "in_progress" | "review" | "done") => {
      setIsUpdatingStatus(true);
      const previousStatus = currentStatus;

      // Optimistic update
      setCurrentStatus(newStatus);

      const supabase = createClient();
      const { error } = await supabase
        .from("requests")
        .update({ status: newStatus })
        .eq("id", request.id);

      if (error) {
        setCurrentStatus(previousStatus);
        toast.error(t("detail.couldntUpdate"));
        setIsUpdatingStatus(false);
        return;
      }

      if (newStatus === "done") {
        fireConfetti();
        toast.success(t("detail.approved"), {
          duration: 5000,
        });
      } else {
        toast.success(`Status updated to ${statusConfig[newStatus].label}`);
      }

      setIsUpdatingStatus(false);
      router.refresh();

      // Fire-and-forget email notification
      fetch("/api/portal/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "status_changed",
          request_id: request.id,
          new_status: newStatus,
          old_status: previousStatus,
        }),
      }).catch(() => {});
    },
    [currentStatus, request.id, router]
  );

  // Client approves a delivery → persist "done", surface the Peak-End
  // celebration modal with the real count of completed requests together.
  const handleClientApprove = useCallback(async () => {
    setIsUpdatingStatus(true);
    const previousStatus = currentStatus;
    setCurrentStatus("done");

    const supabase = createClient();
    const { error } = await supabase
      .from("requests")
      .update({ status: "done" })
      .eq("id", request.id);

    if (error) {
      setCurrentStatus(previousStatus);
      toast.error(t("detail.couldntUpdate"));
      setIsUpdatingStatus(false);
      return;
    }
    setIsUpdatingStatus(false);

    // Real count of completed requests for this client (includes the one we
    // just approved). head:true keeps it a count-only query.
    const { count } = await supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("client_id", request.client_id)
      .eq("status", "done");
    setDoneCount(typeof count === "number" ? count : null);

    setShowCelebration(true);
    fireConfetti();
    router.refresh();

    fetch("/api/portal/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "status_changed",
        request_id: request.id,
        new_status: "done",
        old_status: previousStatus,
      }),
    }).catch(() => {});
  }, [currentStatus, request.id, request.client_id, router, t]);

  // Rating persists with zero schema change: it lands as a comment in the
  // thread (stars + a localized line) so admins see it, and reuses the
  // existing comment notification.
  const handleRate = useCallback(
    async (n: number) => {
      if (rating) return; // one rating per celebration
      setRating(n);
      const stars = "★".repeat(n) + "☆".repeat(5 - n);
      const supabase = createClient();
      const { error } = await supabase.from("comments").insert({
        request_id: request.id,
        author_id: currentUserId,
        body: `${stars} — ${t("celebrate.rated")}`,
      });
      if (error) {
        toast.error(t("detail.couldntPost"));
        setRating(0);
        return;
      }
      toast.success(t("celebrate.thanks"));
      router.refresh();
      fetch("/api/portal/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "comment_added", request_id: request.id }),
      }).catch(() => {});
    },
    [rating, request.id, currentUserId, router, t]
  );

  const handleRequestChanges = useCallback(() => {
    if (!comment.trim()) {
      toast(
        t("detail.writeFeedbackFirst"),
        { description: t("detail.addComment"), duration: 5000 }
      );
      // Scroll textarea into view and focus with visual pulse
      commentInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        commentInputRef.current?.focus();
        commentInputRef.current?.classList.add("ring-2", "ring-primary");
        setTimeout(() => commentInputRef.current?.classList.remove("ring-2", "ring-primary"), 2000);
      }, 300);
      return;
    }
    (async () => {
      setIsSubmitting(true);
      const commentText = comment.trim();

      const supabase = createClient();
      const { error } = await supabase.from("comments").insert({
        request_id: request.id,
        author_id: currentUserId,
        body: commentText,
      });

      if (error) {
        toast.error(t("detail.couldntPost"));
        setIsSubmitting(false);
        return;
      }

      setComment("");
      setIsSubmitting(false);
      await handleStatusChange("in_progress");
    })();
  }, [comment, request.id, currentUserId, handleStatusChange]);

  const handleUploadFiles = useCallback(
    async (files: FileList) => {
      if (!files.length) return;
      setIsUploading(true);

      const supabase = createClient();
      let successCount = 0;

      for (const file of Array.from(files)) {
        const filePath = `${request.client_id}/${request.id}/${Date.now()}-${sanitizeFileName(file.name)}`;

        const { error: uploadError } = await supabase.storage
          .from("deliverables")
          .upload(filePath, file);

        if (uploadError) {
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { error: dbError } = await supabase
          .from("deliverables")
          .insert({
            request_id: request.id,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type || null,
            uploaded_by: currentUserId,
            is_hidden: true,
          });

        if (dbError) {
          toast.error(`Failed to save ${file.name} record`);
          continue;
        }

        successCount++;
      }

      if (successCount > 0) {
        toast.success(
          `Uploaded ${successCount} ${successCount === 1 ? "file" : "files"} (hidden until you reveal ${successCount === 1 ? "it" : "them"})`
        );
        router.refresh();
        // No notification here — fires when admin reveals (unhides) the files
      }

      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [request.id, request.client_id, currentUserId, router]
  );

  const handleUpdateTags = useCallback(
    async (deliverableId: string, tags: string[]) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("deliverables")
        .update({ tags })
        .eq("id", deliverableId);
      if (error) {
        toast.error("Couldn't update tags");
        return;
      }
      router.refresh();
    },
    [router]
  );

  // --- Social Post (Carousel) handlers ---
  const handleUpdateCarouselTags = useCallback(
    async (postId: string, tags: string[]) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("social_posts")
        .update({ tags })
        .eq("id", postId);
      if (error) {
        toast.error("Couldn't update tags");
        return;
      }
      router.refresh();
    },
    [router]
  );

  const handleToggleCarouselHidden = useCallback(
    async (post: SocialPost) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("social_posts")
        .update({ is_hidden: !post.is_hidden })
        .eq("id", post.id);
      if (error) {
        toast.error("Couldn't update visibility");
        return;
      }
      toast.success(
        post.is_hidden
          ? "Carousel is now visible to client"
          : "Carousel hidden from client (kept as building blocks)"
      );
      router.refresh();
    },
    [router]
  );

  const handleVoteCarousel = useCallback(
    async (postId: string, comment: string | null) => {
      const supabase = createClient();
      // Clear any previous vote by this user on this request's carousels
      const carouselIds = (socialPosts || []).map((p) => p.id);
      if (carouselIds.length > 0) {
        await supabase
          .from("deliverable_events")
          .delete()
          .eq("user_id", currentUserId)
          .in("social_post_id", carouselIds)
          .in("event_type", ["vote", "direction_vote"]);
      }
      const { error } = await supabase.from("deliverable_events").insert({
        social_post_id: postId,
        user_id: currentUserId,
        event_type: "direction_vote",
        comment,
      });
      if (error) {
        toast.error("Couldn't save your pick");
        return;
      }
      // Confetti — Peak-End rule (respects prefers-reduced-motion)
      fireConfetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      toast.success("The story is set ✨");
      router.refresh();
    },
    [currentUserId, router, socialPosts]
  );

  const handleToggleHidden = useCallback(
    async (deliverable: Deliverable) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("deliverables")
        .update({ is_hidden: !deliverable.is_hidden })
        .eq("id", deliverable.id);

      if (error) {
        toast.error("Couldn't update visibility");
        return;
      }

      const wasHidden = deliverable.is_hidden;
      toast.success(wasHidden ? "File is now visible to client" : "File hidden from client");
      router.refresh();

      // Email notification only fires from "Reveal All" to avoid spam
      // Individual reveals are silent — the client sees it via realtime
    },
    [router]
  );

  const handleRevealAll = useCallback(async () => {
    const hidden = request.deliverables.filter((d) => d.is_hidden);
    if (hidden.length === 0) return;
    const supabase = createClient();
    await Promise.all(
      hidden.map((d) =>
        supabase.from("deliverables").update({ is_hidden: false }).eq("id", d.id)
      )
    );
    toast.success(`Revealed ${hidden.length} file${hidden.length > 1 ? "s" : ""}`);
    router.refresh();
    fetch("/api/portal/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "deliverable_uploaded", request_id: request.id }),
    }).catch(() => {});
  }, [request.deliverables, request.id, router]);

  const handleDeleteDeliverable = useCallback(
    async (deliverable: Deliverable) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("deliverables")
        .delete()
        .eq("id", deliverable.id);

      if (error) {
        toast.error("Couldn't delete file");
        return;
      }

      // Also delete from storage
      await supabase.storage
        .from("deliverables")
        .remove([deliverable.file_path]);

      toast.success(`Deleted ${deliverable.file_name}`);
      router.refresh();
    },
    [router]
  );

  // --- Voting ---
  // Track which deliverable the current user voted for (one pick per request)
  const allDeliverables = realDeliverables;
  const existingVote = allDeliverables
    .flatMap((d) => (d.deliverable_events ?? []).filter((e) => e.event_type === "vote" && e.user_id === currentUserId))
    .map((e) => e.deliverable_id)[0] ?? null;
  const [votedDeliverableId, setVotedDeliverableId] = useState<string | null>(existingVote);

  const handleVote = useCallback(
    async (deliverableId: string) => {
      if (!currentUserId) return;
      const supabase = createClient();

      // If already voted for this one, remove the vote
      if (votedDeliverableId === deliverableId) {
        setVotedDeliverableId(null);
        await supabase
          .from("deliverable_events")
          .delete()
          .eq("deliverable_id", deliverableId)
          .eq("user_id", currentUserId)
          .eq("event_type", "vote");
        router.refresh();
        return;
      }

      // Remove any existing vote for this request
      if (votedDeliverableId) {
        await supabase
          .from("deliverable_events")
          .delete()
          .eq("deliverable_id", votedDeliverableId)
          .eq("user_id", currentUserId)
          .eq("event_type", "vote");
      }

      // Cast new vote
      setVotedDeliverableId(deliverableId);
      await supabase
        .from("deliverable_events")
        .insert({ deliverable_id: deliverableId, user_id: currentUserId, event_type: "vote" });
      router.refresh();
    },
    [currentUserId, votedDeliverableId, router]
  );

  const getVoteCount = (deliverableId: string) => {
    const d = allDeliverables.find((del) => del.id === deliverableId);
    return (d?.deliverable_events ?? []).filter((e) => e.event_type === "vote").length;
  };

  const logDeliverableEvent = useCallback(
    (deliverableId: string, eventType: "view" | "download") => {
      if (!currentUserId) return;
      const supabase = createClient();
      supabase
        .from("deliverable_events")
        .insert({ deliverable_id: deliverableId, user_id: currentUserId, event_type: eventType })
        .then(() => {}, () => {});
    },
    [currentUserId]
  );

  // Realtime: live comment updates
  useRealtime({
    table: "comments",
    event: "INSERT",
    filter: `request_id=eq.${request.id}`,
    onEvent: () => router.refresh(),
  });

  // Scroll to bottom of comments after posting
  useEffect(() => {
    if (allComments.length > 0) {
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [allComments.length]);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const downloadAllUrls = visibleDeliverables.filter((d) => d.url);
  const hiddenDeliverables = realDeliverables.filter((d) => d.is_hidden);

  // Zip + download every visible deliverable. Shared by the deliverables
  // header button and the delivered-state banner (region A).
  const handleDownloadAll = async () => {
    if (downloadAllUrls.length === 0) return;
    if (downloadAllUrls.length > 20) {
      toast.error(t("detail.tooManyFiles"));
      return;
    }
    const toastId = toast.loading(
      t("detail.preparingFiles", { count: downloadAllUrls.length })
    );
    try {
      const zip = new JSZip();
      let failed = 0;
      let totalSize = 0;
      const MAX_SIZE = 200 * 1024 * 1024; // 200MB cap

      // Sequential fetch to avoid holding all blobs in memory at once
      const usedNames = new Set<string>();
      for (const d of downloadAllUrls) {
        try {
          const res = await fetch(d.url!);
          if (!res.ok) {
            failed++;
            continue;
          }
          const blob = await res.blob();
          totalSize += blob.size;
          if (totalSize > MAX_SIZE) {
            toast.error(t("detail.filesTooLarge"), { id: toastId });
            return;
          }
          // Deduplicate file names to prevent silent overwrites
          let name = d.file_name;
          if (usedNames.has(name)) {
            const dot = name.lastIndexOf(".");
            const base = dot >= 0 ? name.slice(0, dot) : name;
            const ext = dot >= 0 ? name.slice(dot) : "";
            let n = 2;
            while (usedNames.has(`${base}-${n}${ext}`)) n++;
            name = `${base}-${n}${ext}`;
          }
          usedNames.add(name);
          zip.file(name, blob);
        } catch {
          failed++;
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${request.title.replace(/[^a-zA-Z0-9]/g, "-")}-files.zip`);

      if (failed > 0) {
        toast.warning(
          t("detail.downloadPartial", { count: failed, s: failed > 1 ? "s" : "" }),
          { id: toastId }
        );
      } else {
        toast.success(t("detail.downloadReady"), { id: toastId });
      }
    } catch {
      toast.error(t("detail.downloadFailed"), { id: toastId });
    }
  };

  return (
    <div
      className={`mx-auto space-y-6 pb-36 md:pb-6 ${
        isAdmin ? "max-w-3xl" : "max-w-2xl"
      }`}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href={backHref}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            <ArrowLeft01Icon size={16} />
            {isAdmin ? t("detail.backToClient") : t("detail.myRequests")}
          </Link>
          {isAdmin && (
            <span
              className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
              style={{
                background: "var(--accent)",
                color: "var(--accent-foreground)",
              }}
            >
              {t("detail.adminView")}
            </span>
          )}
        </div>
        <span className="text-right text-xs text-[color:var(--vimi-muted)]">
          {t("detail.requested")} {requestedDate} · {t("detail.updated")} {updatedDate}
        </span>
      </div>

      {/* Header card (v2) — badges, serif title, description, edit pill,
          meta, goal-gradient stepper, queue callout. Replaced by the edit
          form while editing (queued clients only). */}
      {!isEditing && (
        <div className="vm-rise rounded-[20px] border border-[color:var(--vimi-border)] bg-white p-6 shadow-[0_2px_8px_rgba(28,27,31,0.05)] sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em] ${typeColors[request.type] ?? typeColors.other}`}
                >
                  {typeLabels[request.type] ? t(`form.type.${request.type}` as PortalKey) : request.type}
                </span>
                {priority && (
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em] ${priorityBadgeColors[request.priority] ?? priorityBadgeColors[1]}`}
                  >
                    {t(priority.labelKey as PortalKey)}
                  </span>
                )}
              </div>
              <h1 className="mt-3 font-serif text-[28px] italic leading-tight text-[color:var(--vimi-ink)] sm:text-[32px]">
                {request.title}
              </h1>
              {request.description ? (
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--vimi-muted)]">
                  {request.description}
                </p>
              ) : (
                <p className="mt-2 text-sm italic text-[color:var(--vimi-faint)]">
                  {t("detail.noDescription")}
                </p>
              )}
            </div>
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="shrink-0 rounded-full border border-[color:var(--vimi-border)] px-4 py-2 text-xs font-semibold text-[color:var(--vimi-ink)] transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
              >
                {t("edit.title")}
              </button>
            )}
          </div>

          {(showCreator || request.due_date || isAdmin) && (
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[color:var(--vimi-muted)]">
              {showCreator && (
                <span>{t("detail.createdBy", { name: firstName(creatorName)! })}</span>
              )}
              {request.due_date && (
                <span className="flex items-center gap-1">
                  <CalendarIcon size={12} />
                  {t("detail.due")} {dueDateLong}
                </span>
              )}
              {isAdmin && (
                <span className="flex items-center gap-1.5">
                  Assigned to
                  <AssigneeMenu
                    requestId={request.id}
                    assigneeId={request.assignee_id}
                    admins={admins}
                    size="md"
                    showName
                  />
                </span>
              )}
            </div>
          )}

          <div className="my-5 h-px bg-[color:var(--vimi-border)]" />
          <ProgressStepper currentStatus={currentStatus} t={t} />

          {/* Queue-position callout — client only, open requests only, and
              only ever REAL data: rank from the server, ETA gated on a real
              due date, designer name from the assignee (else neutral). */}
          {!isAdmin &&
            queuePosition != null &&
            (currentStatus === "queued" || currentStatus === "in_progress") && (
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-[color:var(--vimi-border)] bg-[#FBFAF8] px-4 py-3">
                <span className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
                  <span
                    aria-hidden
                    className="vm-pulse absolute inset-0 rounded-full"
                    style={{ background: "var(--accent)" }}
                  />
                  <span
                    className="relative h-2.5 w-2.5 rounded-full"
                    style={{ background: "var(--accent)" }}
                  />
                </span>
                <p className="text-[13px] text-[color:var(--vimi-ink)]">
                  <span className="font-semibold">
                    {t("detail.queuePosition", { n: queuePosition })}
                  </span>
                  {" · "}
                  {t("detail.queueBy", { who: designerName })}
                  {dueDateShort && (
                    <>
                      {" · "}
                      {t("detail.queueEta", { date: dueDateShort })}
                    </>
                  )}
                </p>
              </div>
            )}

          {/* Per-state status note (region B) — amber while in review, green
              once delivered. Client-only: admins get the status control below. */}
          {!isAdmin && currentStatus === "review" && (
            <div
              className="mt-5 flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background: "var(--status-review-bg)",
                border: "1px solid rgba(201,130,27,0.3)",
              }}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: "var(--status-review)" }}
              />
              <p className="text-[13px] text-[color:var(--vimi-ink)]">
                {t("detail.reviewNote")}
              </p>
            </div>
          )}
          {!isAdmin && currentStatus === "done" && (
            <div
              className="mt-5 flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "#F2F7F2", border: "1px solid rgba(46,139,87,0.25)" }}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: "var(--status-done)" }}
              />
              <p className="text-[13px] text-[color:var(--vimi-ink)]">
                {t("detail.doneNote", {
                  date: new Date(request.updated_at).toLocaleDateString(
                    locale === "es" ? "es-ES" : "en-US",
                    { month: "long", day: "numeric" }
                  ),
                })}
              </p>
            </div>
          )}

          {/* Admin status segmented control (region G) — drives the real
              status-change handler (+ emails). "Delivered" keeps its confirm
              dialog since it skips the client review step. */}
          {isAdmin && (
            <div className="mt-5">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--vimi-faint)]">
                {t("detail.adminStatusLabel")}
              </div>
              <div className="flex gap-1 rounded-xl border border-[color:var(--vimi-border)] bg-[#FBFAF8] p-1">
                {statusSteps.map((step) => {
                  const active = currentStatus === step.key;
                  const pillClass = `flex-1 rounded-lg px-2 py-2 text-[12px] font-semibold transition-colors disabled:opacity-60 ${
                    active
                      ? "text-[color:var(--accent-foreground)]"
                      : "text-[color:var(--vimi-muted)] hover:text-[color:var(--vimi-ink)]"
                  }`;
                  const pillStyle = active
                    ? { background: "var(--accent)" }
                    : undefined;
                  if (step.key === "done") {
                    return (
                      <AlertDialog key={step.key}>
                        <AlertDialogTrigger asChild>
                          <button
                            className={pillClass}
                            style={pillStyle}
                            disabled={isUpdatingStatus || active}
                          >
                            {t(`status.${step.key}` as PortalKey)}
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t("detail.markDoneConfirm")}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("detail.markDoneDesc")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {t("detail.cancel")}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleStatusChange("done")}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              {t("detail.markDone")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    );
                  }
                  return (
                    <button
                      key={step.key}
                      onClick={() => handleStatusChange(step.key)}
                      className={pillClass}
                      style={pillStyle}
                      disabled={isUpdatingStatus || active}
                    >
                      {t(`status.${step.key}` as PortalKey)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Completion Banner (region A) — emerald bar, real delivered date,
          wired to the shared download-all handler. */}
      {currentStatus === "done" && (
        <CompletionBanner
          updatedAt={request.updated_at}
          locale={locale}
          t={t}
          onDownloadAll={handleDownloadAll}
          canDownloadAll={downloadAllUrls.length > 0}
        />
      )}

      {/* Review hero moment — directions voting or standard banner */}
      {currentStatus === "review" && hasDirections && (
        <DirectionsVoting
          directions={realDeliverables
            .filter((d) => d.direction_label && (!d.is_hidden || isAdmin))
            .map((d) => ({
              ...d,
              direction_label: d.direction_label ?? null,
              direction_description: d.direction_description ?? null,
              direction_order: d.direction_order ?? null,
              is_recommended: d.is_recommended ?? false,
              deliverable_events: (d.deliverable_events ?? []).map((e) => ({
                ...e,
                comment: e.comment ?? null,
              })),
            }))}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          clientName={clientName}
          requestId={request.id}
          onVoteComplete={() => router.refresh()}
        />
      )}
      {currentStatus === "review" && !hasDirections && !isAdmin && (
        <div
          className="rounded-2xl border p-5 space-y-2"
          style={{ background: "var(--status-review-bg)", borderColor: "rgba(201,130,27,0.35)" }}
        >
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className="text-[10.5px] font-bold tracking-[0.08em] rounded-md px-2 py-1"
              style={{ background: "var(--status-review-chip)", color: "var(--status-review-ink)" }}
            >
              {t("detail.readyChip")}
            </span>
            {reviewMeta && (
              <span className="text-[12.5px] text-[color:var(--vimi-muted)]">{reviewMeta}</span>
            )}
          </div>
          <p className="font-serif italic text-[22px] leading-tight text-[color:var(--vimi-ink)]">
            {t("detail.reviewHero")}
          </p>
          <p className="text-sm text-[color:var(--vimi-muted)]">{t("detail.reviewHeroSub")}</p>
        </div>
      )}

      {/* Edit form (queued clients only) — replaces the header card while active */}
      {isEditing && (
        <div className="bg-white border border-[color:var(--vimi-border)] rounded-[20px] p-6 shadow-[0_2px_8px_rgba(28,27,31,0.04)] space-y-5">
          <h2 className="font-serif italic text-2xl leading-tight text-[color:var(--vimi-ink)]">
            {t("edit.heading")}
          </h2>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--vimi-muted)]">
              {t("form.essentials.titleLabel")}
            </label>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder={t("form.name.placeholder")}
              className="h-14 rounded-xl bg-[#FBFAF8] border-[color:rgba(28,27,31,0.14)] font-serif text-2xl italic text-[color:var(--vimi-ink)]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--vimi-muted)]">
              {t("form.essentials.briefLabel")}
            </label>
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder={t("form.details.placeholder")}
              className="min-h-[120px] resize-none text-base rounded-xl bg-[#FBFAF8] border-[color:rgba(28,27,31,0.14)]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--vimi-muted)]">
              {t("form.step.type")}
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(typeLabels) as string[]).map((typeKey) => {
                const selected = editType === typeKey;
                return (
                  <button
                    key={typeKey}
                    onClick={() => setEditType(typeKey)}
                    className={`text-sm font-semibold px-4 py-2 rounded-full border transition-all active:scale-[0.98] touch-manipulation ${
                      selected
                        ? "text-[color:var(--accent)]"
                        : "border-[color:rgba(28,27,31,0.12)] bg-white text-muted-foreground hover:border-gray-300"
                    }`}
                    style={
                      selected
                        ? {
                            borderColor: "var(--accent)",
                            background: "color-mix(in srgb, var(--accent) 6%, transparent)",
                          }
                        : undefined
                    }
                  >
                    {t(`form.type.${typeKey}` as PortalKey)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--vimi-muted)]">
              {t("form.essentials.timelineLabel")}
            </label>
            <div className="flex gap-2">
              {[
                { value: 1, label: t("form.priority.whenever") },
                { value: 2, label: t("form.priority.thisWeek") },
                { value: 3, label: t("form.priority.urgent") },
              ].map((p) => {
                const selected = editPriority === p.value;
                return (
                  <button
                    key={p.value}
                    onClick={() => setEditPriority(p.value)}
                    className={`flex-1 text-sm font-semibold py-2.5 rounded-xl border transition-all active:scale-[0.98] touch-manipulation ${
                      selected
                        ? "text-[color:var(--accent)]"
                        : "border-[color:rgba(28,27,31,0.12)] bg-white text-muted-foreground hover:border-gray-300"
                    }`}
                    style={
                      selected
                        ? {
                            borderColor: "var(--accent)",
                            background: "color-mix(in srgb, var(--accent) 6%, transparent)",
                          }
                        : undefined
                    }
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer actions — Cancel (quiet) + Save (ink), matching every other card */}
          <div className="flex items-center gap-3 pt-1">
            <Button
              variant="outline"
              onClick={handleCancelEdit}
              className="h-12 px-6 rounded-xl text-muted-foreground"
            >
              {t("edit.cancel")}
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!editTitle.trim() || isSavingEdit}
              className="flex-1 h-12 rounded-xl font-semibold bg-[color:var(--vimi-ink)] hover:bg-[color:var(--vimi-ink)]/90 text-[color:var(--vimi-page)] disabled:opacity-100 disabled:bg-[color:rgba(28,27,31,0.06)] disabled:text-[#9A96A3] disabled:shadow-none"
            >
              {isSavingEdit ? t("edit.saving") : t("edit.save")}
            </Button>
          </div>
        </div>
      )}

      {/* Social Posts (Carousels) — Story-driven directions */}
      {socialPosts.length > 0 && (() => {
        // Hide hidden posts from clients; admins see them dimmed
        const visiblePosts = isAdmin
          ? [...socialPosts].sort((a, b) => (a.direction_order ?? 999) - (b.direction_order ?? 999))
          : socialPosts.filter((p) => !p.is_hidden).sort((a, b) => (a.direction_order ?? 999) - (b.direction_order ?? 999));
        if (visiblePosts.length === 0) return null;

        const inDirections = request.voting_mode === "single" || request.voting_mode === "team";
        const multi = visiblePosts.length >= 2;

        // Existing vote (client side)
        const myVote = visiblePosts.find((p) =>
          p.deliverable_events?.some(
            (e) => e.user_id === currentUserId && (e.event_type === "vote" || e.event_type === "direction_vote")
          )
        );
        const hasVoted = !!myVote;
        const designersPick = visiblePosts.find((p) => p.is_recommended);

        return (
          <div className="space-y-4">
            {/* Hero — Narrative Transportation (P1: bilingual) */}
            {multi && inDirections && !isAdmin && (
              <div className="space-y-1">
                <h2 className="text-base font-semibold">
                  {hasVoted ? t("directions.heroDone") : t("directions.heroPick")}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {hasVoted ? t("directions.heroDoneHint") : t("directions.heroPickHint")}
                </p>
              </div>
            )}
            {!inDirections && (
              <h2 className="text-sm font-medium">
                {multi ? t("detail.carouselsHeading", { count: visiblePosts.length }) : t("detail.carouselHeading")}
              </h2>
            )}

            {/* Designer's Pick banner — elevated per Marcus + Lorena feedback */}
            {multi && inDirections && !isAdmin && !hasVoted && designersPick && (
              <button
                onClick={() => handleVoteCarousel(designersPick.id, null)}
                className="w-full rounded-xl bg-gradient-to-r from-primary to-primary/70 p-4 text-left text-white hover:opacity-90 transition-all active:scale-[0.99]"
              >
                <div className="text-[11px] uppercase tracking-wider opacity-90 mb-0.5">
                  {t("detail.designersPick")}
                </div>
                <div className="text-sm font-semibold">
                  {designersPick.direction_label || `${t("directions.option")} ${(designersPick.direction_order ?? 0) + 1}`}
                </div>
                <div className="text-xs opacity-90 mt-1">
                  {locale === "es"
                    ? "Tu estudio recomienda esta. Toca para elegirla, o explora ambas abajo."
                    : "Your studio recommends this one. Tap to choose it, or explore both below."}
                </div>
              </button>
            )}

            {/* Admin: Direction Organizer for carousels */}
            {isAdmin && multi && (
              <DirectionOrganizer
                deliverables={visiblePosts.map((p) => ({
                  id: p.id,
                  file_name: p.ig_caption?.slice(0, 40) || "Carousel",
                  mime_type: null,
                  url: p.social_slides.find((s) => s.url)?.url ?? null,
                  direction_label: p.direction_label ?? null,
                  direction_description: p.direction_description ?? null,
                  direction_order: p.direction_order ?? null,
                  is_recommended: p.is_recommended ?? false,
                }))}
                requestId={request.id}
                votingMode={request.voting_mode ?? null}
                entityTable="social_posts"
                heading="Present carousels as Story Directions"
                onUpdate={() => router.refresh()}
              />
            )}

            {/* Grid — 1 col mobile, 2 col on desktop when 2+ */}
            <div className={multi ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "flex justify-center"}>
              {visiblePosts.map((post, idx) => {
                const slides = post.social_slides
                  .filter((s) => s.url)
                  .map((s) => ({ url: s.url!, alt: s.alt_text || undefined }));
                if (slides.length === 0) return null;

                const isMyVote = myVote?.id === post.id;
                const isWinner = hasVoted && isMyVote;
                const isLoser = hasVoted && !isMyVote;

                // Per persona feedback: drop "story-flavored" preset labels —
                // strategist called them vibes, Marcus called them pretentious,
                // Lorena said "Direction" reads as GPS in Spanish. Use clean
                // "Option A / Opción A" defaults; admins can override.
                const letter = String.fromCharCode(65 + idx);
                const label = post.direction_label || (inDirections ? `${t("directions.option")} ${letter}` : null);

                return (
                  <div
                    key={post.id}
                    className={`flex flex-col items-center gap-3 transition-opacity ${
                      isLoser ? "opacity-40" : ""
                    } ${post.is_hidden ? "ring-1 ring-amber-400/40 rounded-lg p-2" : ""}`}
                  >
                    {/* Story label header (Curiosity Gap) */}
                    {inDirections && label && (
                      <div className="w-full flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{label}</span>
                          {post.is_recommended && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary text-white">
                              {t("detail.designersPick")}
                            </span>
                          )}
                          {isWinner && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500 text-white">
                              {t("detail.yourPick")}
                            </span>
                          )}
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => handleToggleCarouselHidden(post)}
                            className="text-[11px] text-muted-foreground hover:text-foreground"
                            title={post.is_hidden ? "Show to client" : "Hide from client (keep as building block)"}
                          >
                            {post.is_hidden ? "Hidden" : "Hide"}
                          </button>
                        )}
                      </div>
                    )}

                    {/* The carousel itself — kept inline; fullscreen removed because
                        the Dialog wasn't meaningfully larger and the wrapping button
                        conflicted with drag-to-swipe on desktop. */}
                    <InstagramCarouselPreview
                      slides={slides}
                      handle={post.ig_handle || "@handle"}
                      caption={post.ig_caption || undefined}
                      subtitle={inDirections ? (label || "Carousel") : "Instagram Carousel"}
                    />

                    {/* Premise (Generation Effect) — kept; this is the load-bearing
                        storytelling element per brand strategist's review */}
                    {inDirections && post.direction_description && (
                      <p className="text-xs text-muted-foreground italic text-center max-w-[28ch]">
                        &ldquo;{post.direction_description}&rdquo;
                      </p>
                    )}

                    {/* Vote CTA — bilingual, "Esta es la buena" in Spanish */}
                    {inDirections && !isAdmin && !hasVoted && (
                      <button
                        onClick={() => handleVoteCarousel(post.id, null)}
                        className="w-full max-w-[320px] h-12 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary/90 active:scale-95 transition-all"
                      >
                        {t("directions.pickStory")}
                      </button>
                    )}
                    {inDirections && !isAdmin && hasVoted && isMyVote && (
                      <div className="w-full max-w-[320px] text-center text-xs text-muted-foreground">
                        {t("directions.refining")}
                      </div>
                    )}

                    {/* Tags row (admin only or if tags exist) */}
                    {(isAdmin || (post.tags && post.tags.length > 0)) && (
                      <div className="w-full max-w-[320px] flex flex-wrap items-center gap-1.5 px-1">
                        {(post.tags ?? []).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground inline-flex items-center gap-1"
                          >
                            {tag}
                            {isAdmin && (
                              <button
                                onClick={() =>
                                  handleUpdateCarouselTags(
                                    post.id,
                                    (post.tags ?? []).filter((t) => t !== tag)
                                  )
                                }
                                className="hover:text-foreground"
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                        {isAdmin && (
                          <CarouselTagInput
                            onAdd={(tag) =>
                              handleUpdateCarouselTags(
                                post.id,
                                Array.from(new Set([...(post.tags ?? []), tag]))
                              )
                            }
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Admin: Direction Organizer (excludes carousel placeholder files) */}
      {isAdmin && realDeliverables.length >= 2 && (
        <DirectionOrganizer
          deliverables={realDeliverables.map((d) => ({
            id: d.id,
            file_name: d.file_name,
            mime_type: d.mime_type,
            url: d.url,
            direction_label: d.direction_label ?? null,
            direction_description: d.direction_description ?? null,
            direction_order: d.direction_order ?? null,
            is_recommended: d.is_recommended ?? false,
          }))}
          requestId={request.id}
          votingMode={request.voting_mode ?? null}
          onUpdate={() => router.refresh()}
        />
      )}

      {/* Deliverables (excludes carousel placeholder files — those render above) */}
      {realDeliverables.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">
              {`${t("detail.yourDesigns")} (${realDeliverables.length})`}
            </h2>
            <div className="flex items-center gap-1">
            {isAdmin && hiddenDeliverables.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 gap-1 text-amber-600 hover:text-amber-700"
                onClick={handleRevealAll}
              >
                <ViewIcon size={12} />
                Reveal All ({hiddenDeliverables.length})
              </Button>
            )}
            {downloadAllUrls.length >= 2 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 gap-1"
                onClick={handleDownloadAll}
              >
                <Download01Icon size={12} />
                {t("detail.downloadAll")}
              </Button>
            )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {realDeliverables
              .filter((d) => isAdmin || !d.is_hidden)
              .map((d) => {
              const isImage = d.mime_type?.startsWith("image/") && d.url;
              const imageIndex = isImage
                ? lightboxImages.findIndex((img) => img.url === d.url)
                : -1;

              return (
                <DeliverableCard
                  key={d.id}
                  d={d}
                  isAdmin={isAdmin}
                  onImageClick={
                    imageIndex >= 0
                      ? () => {
                          setLightboxIndex(imageIndex);
                          setLightboxOpen(true);
                          logDeliverableEvent(d.id, "view");
                        }
                      : undefined
                  }
                  onDelete={
                    isAdmin && currentStatus !== "done"
                      ? () => {
                          if (confirm(`Delete "${d.file_name}"? This can't be undone.`)) {
                            handleDeleteDeliverable(d);
                          }
                        }
                      : undefined
                  }
                  onToggleHidden={
                    isAdmin
                      ? () => handleToggleHidden(d)
                      : undefined
                  }
                  onUpdateTags={
                    isAdmin
                      ? (tags) => handleUpdateTags(d.id, tags)
                      : undefined
                  }
                  onDownload={() => logDeliverableEvent(d.id, "download")}
                  onVote={
                    // Only show vote CTA when admin has explicitly enabled directions mode
                    // (voting_mode set) — otherwise treat multi-deliverable requests as a series,
                    // not competing options.
                    (request.voting_mode === "single" || request.voting_mode === "team") &&
                    allDeliverables.filter((del) => !del.is_hidden || isAdmin).length > 1
                      ? () => handleVote(d.id)
                      : undefined
                  }
                  isVoted={votedDeliverableId === d.id}
                  voteLabel={(() => {
                    const n = getVoteCount(d.id);
                    if (n === 0) return t("detail.pickThis");
                    return n === 1 ? t("detail.onePick") : t("detail.nPicks", { count: n });
                  })()}
                  downloadErrorLabel={t("detail.downloadFileFailed")}
                />
              );
            })}
          </div>
        </div>
      ) : currentStatus === "queued" ? null : (
        <div className="flex flex-col items-center gap-2 rounded-[18px] border border-dashed border-[color:var(--vimi-border)] bg-white/60 px-6 py-10 text-center">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: "rgba(28,27,31,0.04)" }}
          >
            <Upload01Icon size={18} className="text-[color:var(--vimi-faint)]" />
          </span>
          <p className="text-sm font-semibold text-[color:var(--vimi-ink)]">
            {currentStatus === "in_progress" || currentStatus === "review"
              ? t("detail.designsWillAppear")
              : t("detail.noDeliverables")}
          </p>
          {(currentStatus === "in_progress" || currentStatus === "review") && (
            <p className="max-w-[38ch] text-[13px] text-[color:var(--vimi-muted)]">
              {t("detail.designsWillAppearSub")}
            </p>
          )}
        </div>
      )}

      {/* Admin: Upload deliverables */}
      {isAdmin && currentStatus !== "done" && (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.ai,.psd,.sketch,.fig,.svg,.zip"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleUploadFiles(e.target.files);
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex w-full items-center justify-center gap-2 rounded-[18px] border-2 border-dashed p-4 text-sm font-semibold text-[color:var(--accent)] transition-colors hover:bg-[color:rgba(28,27,31,0.02)] disabled:opacity-50"
            style={{ borderColor: "color-mix(in srgb, var(--accent) 35%, transparent)" }}
          >
            {isUploading ? (
              <>
                <div
                  className="h-4 w-4 animate-spin rounded-full border-2"
                  style={{
                    borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
                    borderTopColor: "var(--accent)",
                  }}
                />
                {t("detail.uploading")}
              </>
            ) : (
              <>
                <Upload01Icon size={16} />
                {t("detail.uploadDeliverables")}
              </>
            )}
          </button>
        </div>
      )}

      {/* Review action bar (region E) — the decision point. Prompt + approve
          (accent) + request-changes (outline). Approve fires the existing
          confetti + haptic + peak-end modal; request-changes reuses the
          existing feedback-first handler. */}
      {currentStatus === "review" && !isAdmin && (
        <div className="rounded-2xl border border-[color:var(--vimi-border)] bg-white p-4 shadow-[0_2px_8px_rgba(28,27,31,0.05)] sm:p-5">
          <p className="mb-3 font-serif text-[19px] italic leading-tight text-[color:var(--vimi-ink)]">
            {t("detail.reviewPrompt")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleClientApprove}
              disabled={isUpdatingStatus}
              className="flex-1 inline-flex items-center justify-center gap-2 h-14 rounded-full text-[color:var(--accent-foreground)] text-base font-semibold shadow-[0_10px_26px_rgba(28,27,31,0.18)] transition-transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 touch-manipulation"
              style={{ background: "var(--accent)" }}
            >
              <CheckmarkCircle01Icon size={20} color="currentColor" />
              {isUpdatingStatus ? t("detail.approving") : t("detail.approve")}
            </button>
            <button
              onClick={handleRequestChanges}
              disabled={isUpdatingStatus || isSubmitting}
              className="inline-flex items-center justify-center h-14 px-6 rounded-full border border-[color:var(--vimi-border)] bg-white text-[color:var(--vimi-ink)] text-sm font-semibold transition-colors hover:bg-[color:rgba(28,27,31,0.03)] disabled:opacity-50 touch-manipulation"
            >
              {t("detail.askForChanges")}
            </button>
          </div>
        </div>
      )}

      {/* Reference Images */}
      {request.reference_images.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium">
            {t("detail.references")} ({request.reference_images.length})
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {request.reference_images.map((ref) => (
              <a
                key={ref.id}
                href={ref.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
              >
                {ref.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ref.url}
                    alt={ref.file_name}
                    className="w-16 h-16 rounded-lg object-cover hover:ring-2 ring-primary transition-shadow"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground">
                      {ref.file_name.split(".").pop()?.toUpperCase()}
                    </span>
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Activity Timeline */}
      {activityLog.length > 0 && <ActivityTimeline entries={activityLog} locale={locale} />}

      {/* Conversation — WhatsApp-style two-sided chat */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <h2 className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[color:var(--vimi-faint)]">
            {t("detail.conversationEyebrow")}
          </h2>
          <span className="text-[11px] text-[color:var(--vimi-faint)]">
            {t("detail.conversationWith", { designer: designerName })}
          </span>
        </div>

        {allComments.map((c) => {
          const isOwnComment = c.author_id === currentUserId;
          const isOptimistic = c.id.startsWith("optimistic-");
          const authorInitials = getInitials(c.profiles?.full_name ?? "?");
          const isAdminComment = c.profiles?.role === "admin";
          const who = c.profiles?.full_name ?? t("detail.unknownUser");

          return (
            <div
              key={c.id}
              className={`flex items-end gap-2 ${isOwnComment ? "flex-row-reverse" : ""} ${
                isOptimistic ? "opacity-60" : ""
              }`}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={c.profiles?.avatar_url ?? undefined} />
                <AvatarFallback
                  className={`text-xs ${
                    isOwnComment || isAdminComment ? "text-white" : "bg-gray-200 text-gray-600"
                  }`}
                  style={
                    isOwnComment
                      ? { background: "var(--vimi-ink)" }
                      : isAdminComment
                        ? { background: "var(--accent)" }
                        : undefined
                  }
                >
                  {authorInitials}
                </AvatarFallback>
              </Avatar>
              <div
                className={`flex max-w-[78%] min-w-0 flex-col ${
                  isOwnComment ? "items-end" : "items-start"
                }`}
              >
                <div
                  className="px-3.5 py-2.5"
                  style={
                    isOwnComment
                      ? {
                          background: "var(--vimi-ink)",
                          borderRadius: "16px 16px 4px 16px",
                        }
                      : {
                          background: "#fff",
                          border: "1px solid var(--vimi-border)",
                          borderRadius: "16px 16px 16px 4px",
                        }
                  }
                >
                  {c.body && <CommentBody body={c.body} mine={isOwnComment} />}
                  {c.attachment_url && c.attachment_type?.startsWith("image/") && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.attachment_url}
                      alt={c.attachment_name ?? "attachment"}
                      className="mt-2 rounded-lg max-w-[240px] max-h-[200px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  )}
                  {c.attachment_url && !c.attachment_type?.startsWith("image/") && (
                    <a
                      href={c.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-2 inline-flex items-center gap-1.5 text-xs hover:underline ${
                        isOwnComment ? "text-[#F6F4EF]" : "text-primary"
                      }`}
                    >
                      <Download01Icon size={12} />
                      {c.attachment_name ?? t("detail.attachment")}
                    </a>
                  )}
                </div>
                <div
                  className="mt-1 flex items-center gap-1.5 px-1 text-[11px] text-[color:var(--vimi-faint)]"
                  title={new Date(c.created_at).toLocaleString()}
                >
                  <span>{who}</span>
                  {isAdminComment && !isOwnComment && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      Vimi Studio
                    </span>
                  )}
                  {!isAdminComment && isAdmin && !isOwnComment && (
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
                      Client
                    </span>
                  )}
                  <span>
                    ·{" "}
                    {isOptimistic
                      ? t("detail.justNow")
                      : formatDistanceToNow(new Date(c.created_at), {
                          addSuffix: true,
                          locale: dfnsLocale,
                        })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {allComments.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[color:var(--vimi-border)] px-6 py-8 text-center">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ background: "var(--accent)" }}
            >
              {designerName.charAt(0).toUpperCase()}
            </div>
            <p className="max-w-[42ch] text-sm text-[color:var(--vimi-muted)]">
              {t("detail.emptyChat", { designer: designerName })}
            </p>
          </div>
        )}

        <div ref={commentsEndRef} />
      </div>

      {/* Comment Input — WhatsApp-style, sticky on mobile */}
      <div className="fixed bottom-[calc(3.5rem+max(env(safe-area-inset-bottom),0.5rem))] left-0 right-0 bg-background/95 backdrop-blur-sm border-t px-4 py-2 md:static md:border-t-0 md:px-0 md:py-0 md:bg-background md:backdrop-blur-none z-30">
        <div
          className={`mx-auto ${
            isAdmin ? "max-w-3xl" : "max-w-2xl"
          }`}
        >
          {/* Quick feedback chips — help clients articulate feedback */}
          {currentStatus === "review" && !isAdmin && !comment.trim() && (
            <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {([
                "chip.loveIt",
                "chip.changeColors",
                "chip.changeText",
                "chip.differentLayout",
                "chip.almostThere",
              ] as const).map((chipKey) => {
                const chip = t(chipKey);
                return (
                <button
                  key={chipKey}
                  type="button"
                  onClick={() => {
                    setComment(chip);
                    commentInputRef.current?.focus();
                  }}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-[color:var(--vimi-border)] bg-white hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] transition-colors whitespace-nowrap"
                >
                  {chip}
                </button>
                );
              })}
            </div>
          )}
          {/* Attachment preview */}
          {attachmentPreview && (
            <div className="relative inline-block mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={attachmentPreview}
                alt="attachment"
                className="h-20 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => { setCommentAttachment(null); setAttachmentPreview(null); }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center"
              >
                <Cancel01Icon size={10} />
              </button>
            </div>
          )}
          {commentAttachment && !attachmentPreview && (
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground bg-gray-50 rounded-lg px-3 py-2">
              <span className="truncate">{commentAttachment.name}</span>
              <button
                type="button"
                onClick={() => { setCommentAttachment(null); setAttachmentPreview(null); }}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <Cancel01Icon size={12} />
              </button>
            </div>
          )}
          <div className="flex items-end gap-1.5 rounded-2xl border border-[color:var(--vimi-border)] bg-white px-2 py-1.5 shadow-[0_2px_8px_rgba(28,27,31,0.05)] transition-colors focus-within:border-[color:var(--accent)]">
            <button
              type="button"
              onClick={() => commentFileRef.current?.click()}
              className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground hover:bg-gray-50 transition-colors"
              aria-label="Attach image"
            >
              <PlusSignIcon size={14} />
            </button>
            <input
              ref={commentFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setCommentAttachment(file);
                if (file.type.startsWith("image/")) {
                  const reader = new FileReader();
                  reader.onloadend = () => setAttachmentPreview(reader.result as string);
                  reader.readAsDataURL(file);
                }
                e.target.value = "";
              }}
            />
            <textarea
              ref={commentInputRef}
              aria-label="Add a comment"
              placeholder={t("detail.composerPlaceholder", { designer: composerPartner })}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                const el = e.target;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 200) + "px";
              }}
              maxLength={2000}
              rows={1}
              className="flex-1 min-h-[24px] max-h-[200px] resize-none overflow-y-auto bg-transparent text-base md:text-sm placeholder:text-muted-foreground/60 leading-relaxed"
              style={{ border: 0, outline: "none", padding: 0, background: "transparent", boxShadow: "none" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
              onPaste={(e) => {
                const items = e.clipboardData?.items;
                if (!items) return;
                for (const item of Array.from(items)) {
                  if (item.type.startsWith("image/")) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    if (!file) return;
                    setCommentAttachment(file);
                    const reader = new FileReader();
                    reader.onloadend = () => setAttachmentPreview(reader.result as string);
                    reader.readAsDataURL(file);
                    return;
                  }
                }
              }}
            />
            <button
              aria-label="Send comment"
              onClick={handleSubmitComment}
              disabled={(!comment.trim() && !commentAttachment) || isSubmitting}
              className={`shrink-0 h-11 px-4 rounded-full inline-flex items-center justify-center gap-1.5 text-sm font-semibold transition-all ${
                comment.trim() || commentAttachment
                  ? "text-white hover:opacity-90"
                  : "bg-[color:rgba(28,27,31,0.06)] text-[color:var(--vimi-faint)]"
              }`}
              style={
                comment.trim() || commentAttachment
                  ? { background: "var(--accent)" }
                  : undefined
              }
            >
              {isSubmitting ? (
                <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <SentIcon
                    size={14}
                    color={comment.trim() || commentAttachment ? "white" : "currentColor"}
                  />
                  <span>{t("detail.send")}</span>
                </>
              )}
            </button>
          </div>
          <div className="hidden md:flex items-center justify-between px-1 mt-1">
            <p className="text-[10px] text-muted-foreground/50">
              {t("detail.sendHint")}
            </p>
            {comment.length > 1500 && (
              <p className="text-[10px] text-muted-foreground">
                {comment.length}/2000
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {lightboxImages.length > 0 && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
        />
      )}

      {/* ── Peak-End celebration modal ── */}
      {showCelebration && (
        <div
          className="vm-fade fixed inset-0 z-[80] flex items-center justify-center p-5"
          style={{ background: "rgba(28,27,31,0.55)", backdropFilter: "blur(6px)" }}
          role="dialog"
          aria-modal="true"
        >
          <div className="vm-pop w-full max-w-[480px] rounded-[28px] bg-white p-10 md:p-11 text-center shadow-[0_40px_90px_rgba(28,27,31,0.35)]">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full text-white text-[28px] bg-primary">
              ✓
            </div>
            <div className="font-serif italic text-[32px] leading-tight mb-2.5 text-[color:var(--vimi-ink)]">
              {t("celebrate.title")}
            </div>
            <p className="mb-7 text-[color:var(--vimi-muted)] leading-relaxed">
              {doneCount === 1
                ? t("celebrate.first")
                : doneCount
                  ? t("celebrate.count", { n: doneCount })
                  : t("celebrate.countFallback")}
            </p>
            <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--vimi-faint)]">
              {t("celebrate.ratedPrompt")}
            </div>
            <div className="mb-7 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => {
                const on = rating >= n;
                return (
                  <button
                    key={n}
                    onClick={() => handleRate(n)}
                    disabled={!!rating}
                    aria-label={`${n}`}
                    className="h-9 w-9 rounded-full border text-[13px] font-bold transition-colors disabled:cursor-default"
                    style={{
                      borderColor: on ? "var(--accent)" : "var(--vimi-border)",
                      background: on ? "var(--accent)" : "#fff",
                      color: on ? "#fff" : "var(--vimi-faint)",
                    }}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push("/portal")}
                className="flex-1 rounded-full border border-[color:var(--vimi-border)] py-3.5 text-sm font-semibold text-[color:var(--vimi-muted)] transition-colors hover:bg-[color:rgba(28,27,31,0.03)]"
              >
                {t("celebrate.backToStudio")}
              </button>
              <button
                onClick={() => router.push("/portal/requests/new")}
                className="flex-1 rounded-full bg-[color:var(--vimi-ink)] py-3.5 text-sm font-semibold text-[var(--vimi-page)]"
              >
                {t("celebrate.newRequest")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
