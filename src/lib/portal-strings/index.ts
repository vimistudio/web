/**
 * Portal i18n — Modular translation system
 *
 * To add translations for a new feature:
 * 1. Create src/lib/i18n/strings/my-feature.ts
 * 2. Export a const object: export const myFeature = { "myFeature.key": { en: "...", es: "..." } } as const;
 * 3. Import and spread it into `portal` below
 * 4. Done — t("myFeature.key") works everywhere
 */

import { status } from "./strings/status";
import { board } from "./strings/board";
import { form } from "./strings/form";
import { detail } from "./strings/detail";
import { gallery } from "./strings/gallery";
import { chrome } from "./strings/chrome";
import { plan } from "./strings/plan";

// Merge all feature dictionaries into one flat map
const portal = {
  ...status,
  ...board,
  ...form,
  ...detail,
  ...gallery,
  ...chrome,
  ...plan,
} as const;

export type Locale = "en" | "es";
export type PortalKey = keyof typeof portal;

/**
 * Get a translated string.
 * Supports interpolation: t("board.workingOn", "es", { count: 3, s: "s" })
 */
export function t(key: PortalKey, locale: Locale = "en", vars?: Record<string, string | number>): string {
  const entry = portal[key];
  let str: string = entry?.[locale] ?? entry?.en ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return str;
}

/** All keys — useful for validation scripts */
export const portalKeys = Object.keys(portal) as PortalKey[];

/** Number of keys per locale — useful for coverage checks */
export const keyCount = portalKeys.length;
