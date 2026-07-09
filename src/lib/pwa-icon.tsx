import { ImageResponse } from "next/og";

// Brand glyph shared by the manifest icons and the iOS apple-icon.
// The mark is the Vimi ribbon "V" (from public/favicon.svg, viewBox 308x330),
// recolored white + lavender highlight so it reads on the violet field.
const VIOLET = "#5B4BD6"; // brand primary accent (globals.css --primary-accent)

const RIBBON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="308" height="330" viewBox="0 0 308 330" fill="none"><path d="M229.65 292.88C228.83 295.57 228.39 296.99 228.39 296.99L196 329.37L0 133.34L32.38 101L36.38 99.67L51.08 114.37L79.67 142.96L94.81 158.1L91 159.34L162.41 230.75L163.69 226.86L178.77 242L207 270.28L229.65 292.88Z" fill="#FFFFFF"/><path d="M229.65 292.88C228.83 295.57 228.39 296.99 228.39 296.99L205.74 274.24L177.52 245.9L178.77 242.01L185.77 220.63L219.5 117.24L209.68 120.46L197 124.6L94.85 158.06L91 159.34L47.52 116.1C47.75 115.98 48.95 115.36 51.07 114.33C54.81 112.46 61.36 109.21 69.96 104.95C93.82 93.15 133.56 73.68 173.75 54.69C205.46 39.67 237.4 25 262 14.55L306.47 0C317 7.14 240.48 257.64 229.65 292.88Z" fill="#FFFFFF"/><path d="M306.47 0L222.48 257.52L213.99 248.98L207.04 270.28L205.74 274.29L162.37 230.75L163.65 226.86L204.36 102.12L79.7099 142.92L75.8199 144.2L32.3799 100.96L36.4199 99.63L57.6999 92.66L49.1499 84.19L262.05 14.53L306.47 0Z" fill="#DED9FF"/></svg>`;

const RIBBON_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(RIBBON_SVG)}`;

/**
 * Vimi home-screen glyph: violet rounded square with the white ribbon mark.
 * - `maskable`: full-bleed violet, mark kept inside the inner ~80% safe zone.
 * - otherwise: rounded square ("any" purpose) with a touch of breathing room.
 */
export function vimiIcon(size: number, maskable = false) {
  const markRatio = maskable ? 0.5 : 0.62;
  const markSize = Math.round(size * markRatio);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: VIOLET,
          borderRadius: maskable ? 0 : size * 0.22,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={RIBBON_DATA_URI} width={markSize} height={markSize} alt="" />
      </div>
    ),
    { width: size, height: size },
  );
}
