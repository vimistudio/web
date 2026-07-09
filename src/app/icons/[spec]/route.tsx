import { vimiIcon } from "@/lib/pwa-icon";

// Generated PWA icons: /icons/192.png, /icons/512.png,
// /icons/maskable-192.png, /icons/maskable-512.png.
// File-convention icons can't express both "any" and "maskable" purposes for
// the manifest, so we render them here and point manifest.ts at these routes.
export const dynamic = "force-static";

export function generateStaticParams() {
  return [
    { spec: "192.png" },
    { spec: "512.png" },
    { spec: "maskable-192.png" },
    { spec: "maskable-512.png" },
  ];
}

export function GET(_req: Request, { params }: { params: { spec: string } }) {
  const name = params.spec.replace(/\.png$/, "");
  const maskable = name.startsWith("maskable-");
  const size = Number(name.replace("maskable-", ""));
  return vimiIcon(size, maskable);
}
