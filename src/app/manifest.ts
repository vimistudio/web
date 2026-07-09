import type { MetadataRoute } from "next";

// Portal PWA manifest. Cream chrome matches the portal shell (globals.css
// --vimi-page #F6F4EF); start_url lands on the client portal. No service
// worker in v1 (deliberate) — install + icons only.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vimi Studio",
    short_name: "Vimi",
    description: "Your Vimi Studio client portal — requests, deliverables, and your plan.",
    lang: "es",
    start_url: "/portal",
    scope: "/",
    display: "standalone",
    background_color: "#F6F4EF",
    theme_color: "#F6F4EF",
    icons: [
      { src: "/icons/192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
