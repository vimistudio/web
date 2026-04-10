/**
 * Portal i18n — Re-export from modular string system.
 *
 * All strings live in src/lib/portal-strings/strings/*.ts
 * To add a new feature's translations:
 * 1. Create src/lib/portal-strings/strings/my-feature.ts
 * 2. Export: export const myFeature = { "myFeature.key": { en: "...", es: "..." } } as const;
 * 3. Import + spread in src/lib/portal-strings/index.ts
 * 4. Done — t("myFeature.key") works in any component via useLocale()
 */
export { t, portalKeys, keyCount } from "./portal-strings";
export type { Locale, PortalKey } from "./portal-strings";
