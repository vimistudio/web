/**
 * Studio contact constants — single source of truth.
 *
 * STUDIO_WHATSAPP is the El Salvador number the client sidebar's "WhatsApp
 * directo" pill links to. Bare international digits only (no +, spaces, or
 * dashes) because wa.me requires that format. Change it here and every deep
 * link updates.
 */
export const STUDIO_WHATSAPP = "50378851556";
export const STUDIO_WHATSAPP_URL = `https://wa.me/${STUDIO_WHATSAPP}`;

/**
 * A studio note is only shown while it's recent. Past this window a presence
 * note reads as neglect ("logos viejos" problem) and erodes trust more than
 * showing nothing.
 */
export const STUDIO_NOTE_STALE_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Whether a studio note should render at all. Hidden when there's no note,
 * when it was never stamped (legacy notes written before the freshness stamp
 * existed → treated as stale), or when it's older than STUDIO_NOTE_STALE_DAYS.
 */
export function isStudioNoteFresh(
  note: string | null | undefined,
  updatedAt: string | null | undefined
): boolean {
  if (!note?.trim()) return false;
  if (!updatedAt) return false;
  const ageMs = Date.now() - new Date(updatedAt).getTime();
  if (Number.isNaN(ageMs)) return false;
  return ageMs <= STUDIO_NOTE_STALE_DAYS * DAY_MS;
}

/**
 * Short, coarse relative caption for when a note was written ("hoy" / "hace 2
 * días" / "hace 1 semana"). Bilingual (es/other → en). Returns null when there
 * is no usable timestamp.
 */
export function studioNoteFreshness(
  updatedAt: string | null | undefined,
  locale: string
): string | null {
  if (!updatedAt) return null;
  const then = new Date(updatedAt).getTime();
  if (Number.isNaN(then)) return null;
  const days = Math.floor((Date.now() - then) / DAY_MS);
  const es = locale === "es";
  if (days <= 0) return es ? "hoy" : "today";
  if (days === 1) return es ? "ayer" : "yesterday";
  if (days < 7) return es ? `hace ${days} días` : `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return es ? "hace 1 semana" : "1 week ago";
  return es ? `hace ${weeks} semanas` : `${weeks} weeks ago`;
}
