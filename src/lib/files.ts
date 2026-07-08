/**
 * Make a filename safe to use as a Supabase Storage object key.
 *
 * Storage keys reject a range of characters (e.g. "×" U+00D7, spaces, accents).
 * We NFD-normalize + strip diacritics, replace anything outside [a-z0-9._-]
 * with a dash, collapse repeated dashes, and lowercase — while preserving the
 * file extension. Use the result for the STORAGE PATH only; keep the original
 * filename for the human-facing display name.
 */
export function sanitizeFileName(name: string): string {
  const clean = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "") // strip diacritics
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();

  const dot = name.lastIndexOf(".");
  if (dot > 0 && dot < name.length - 1) {
    const base = clean(name.slice(0, dot));
    const ext = clean(name.slice(dot + 1));
    const safeBase = base || "file";
    return ext ? `${safeBase}.${ext}` : safeBase;
  }
  return clean(name) || "file";
}
