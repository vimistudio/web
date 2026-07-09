import { vimiIcon } from "@/lib/pwa-icon";

// iOS home-screen icon (180x180). Full-bleed violet (maskable style) since iOS
// applies its own corner mask; keeps the ribbon glyph consistent with the
// manifest icons. Replaces the static /apple-touch-icon.png.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return vimiIcon(180, true);
}
