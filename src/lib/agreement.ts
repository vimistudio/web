/**
 * Agreement hub helpers — pure functions shared by the client hub page/view and
 * the admin docs manager. No React, no Supabase; safe to import anywhere.
 */

/** Document kinds — mirrors the client_documents.kind CHECK constraint. */
export const DOC_KINDS = [
  "proposal",
  "plan",
  "manual",
  "contract",
  "other",
] as const;
export type DocKind = (typeof DOC_KINDS)[number];

/** Title-Case English labels for the admin kind picker (stored values unchanged). */
export const DOC_KIND_LABELS: Record<DocKind, string> = {
  proposal: "Proposal",
  plan: "Plan",
  manual: "Manual",
  contract: "Contract",
  other: "Other",
};

/** A 30-day retainer "month" derived from the engagement start date. */
export interface EngagementMonth {
  /** 1-based month index (day 0–29 → 1, day 30–59 → 2, …). */
  monthIndex: number;
  /** 1-based day within the current 30-day cycle (1–30). */
  dayOfMonth: number;
  /** Progress through the current cycle, 0–1. */
  pct: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Compute the current engagement month from a `date` string ("YYYY-MM-DD").
 * Returns null when there's no start date or the start is in the future — the
 * caller hides the month chip + progress bar entirely in that case.
 */
export function computeEngagementMonth(
  startDate: string | null | undefined,
  now: Date = new Date()
): EngagementMonth | null {
  if (!startDate) return null;
  const start = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) return null;

  const days = Math.floor((now.getTime() - start.getTime()) / DAY_MS);
  if (days < 0) return null; // future engagement date → no month UI yet

  const monthIndex = Math.floor(days / 30) + 1;
  const dayOfMonth = (days % 30) + 1;
  const pct = dayOfMonth / 30;
  return { monthIndex, dayOfMonth, pct };
}

/** PDFs render natively in an iframe (desktop) — everything else falls back. */
export function isPreviewablePdf(mime: string | null | undefined): boolean {
  return mime === "application/pdf";
}

/** Images render as <img> in the viewer modal. */
export function isPreviewableImage(mime: string | null | undefined): boolean {
  return !!mime && mime.startsWith("image/");
}

/** Whether a doc can open in the viewer modal at all (vs. a direct download). */
export function isPreviewable(mime: string | null | undefined): boolean {
  return isPreviewablePdf(mime) || isPreviewableImage(mime);
}

/**
 * Short badge for a document's icon tile: "PDF", "IMG", or the uppercased file
 * extension, falling back to "DOC".
 */
export function docBadge(
  mime: string | null | undefined,
  fileName?: string | null
): string {
  if (isPreviewablePdf(mime)) return "PDF";
  if (isPreviewableImage(mime)) return "IMG";
  const ext = fileName?.split(".").pop();
  if (ext && ext.length <= 4 && ext !== fileName) return ext.toUpperCase();
  return "DOC";
}

/** Human-readable file size. Copy of image-lightbox.tsx's formatter. */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
