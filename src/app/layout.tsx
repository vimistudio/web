import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Template from "../components/template";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "hsl(var(--primary-accent))",
  // Ensure zooming/scaling is enabled for accessibility
  minimumScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://vimistudio.com"),
  title: {
    default: "Vimi Studio - Innovative Design Agency for Digital Products",
    template: "%s | Vimi Studio",
  },
  description:
    "Every click, every scroll — intentionally designed to connect, engage, and inspire.",
  keywords: [
    "design agency",
    "digital products",
    "UX design",
    "UI design",
    "web design",
    "product design",
    "branding",
  ],
  authors: [{ name: "Vimi Studio" }],
  creator: "Vimi Studio",
  publisher: "Vimi Studio",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Vimi Studio - Innovative Design Agency for Digital Products",
    description:
      "Every click, every scroll — intentionally designed to connect, engage, and inspire.",
    url: "https://vimistudio.com",
    siteName: "Vimi Studio",
    images: [
      {
        url: "https://vimistudio.com/og-image.jpeg",
        width: 1200,
        height: 630,
        alt: "Vimi Studio - Digital Product Design Agency",
        type: "image/png",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    "og:image:secure_url": "https://vimistudio.com/og-image.jpeg",
    "og:image:type": "image/png",
    "og:image:width": "1200",
    "og:image:height": "630",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vimi Studio - Innovative Design Agency for Digital Products",
    description:
      "Every click, every scroll — intentionally designed to connect, engage, and inspire.",
    images: ["https://vimistudio.com/og-image.jpeg"],
    creator: "@vimistudio",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      {
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#7076CF",
      },
    ],
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vimi Studio",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Template>{children}</Template>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
