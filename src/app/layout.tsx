import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

// Inter powers the marketing site. The portal opts into Instrument Sans/Serif
// via the `font-sans`/`font-serif` classes (see tailwind fontFamily → the CSS
// variables declared below), so the variables are exposed globally while
// marketing keeps Inter as its body font.
const inter = Inter({ subsets: ["latin"] });
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
});
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

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
        url: "https://vimistudio.com/og-image.png",
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
    "og:image:secure_url": "https://vimistudio.com/og-image.png",
    "og:image:type": "image/png",
    "og:image:width": "1200",
    "og:image:height": "630",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vimi Studio - Innovative Design Agency for Digital Products",
    description:
      "Every click, every scroll — intentionally designed to connect, engage, and inspire.",
    images: ["https://vimistudio.com/og-image.png"],
    creator: "@vimistudio",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
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
      <body
        className={`${inter.className} ${instrumentSans.variable} ${instrumentSerif.variable}`}
      >
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
