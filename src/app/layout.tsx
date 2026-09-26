import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { Consent } from "@/components/consent/Consent";
import { siteConfig } from "@/config/site";
import { CAPTURE_INSTALL_PROMPT_SCRIPT } from "@/features/pwa/capture-script";
import { ServiceWorkerRegistration } from "@/features/pwa/ui/ServiceWorkerRegistration";
import "./globals.css";

// Direction "Werkstatt": Fraunces (soft, optical-size serif) for display type, Hanken Grotesk for
// text, IBM Plex Mono for measurements, labels and numbers.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  style: ["normal", "italic"],
  axes: ["SOFT", "opsz"],
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: siteConfig.title,
    title: siteConfig.title,
    description: siteConfig.description,
  },
  twitter: { card: "summary_large_image" },
  // Home-screen app on iPhone & iPad (the manifest in app/manifest.ts covers all other platforms).
  appleWebApp: { capable: true, title: siteConfig.name, statusBarStyle: "black" },
};

export const viewport: Viewport = {
  themeColor: "#231913",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" data-scroll-behavior="smooth" className={`${fraunces.variable} ${hanken.variable} ${plexMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: CAPTURE_INSTALL_PROMPT_SCRIPT }} />
      </head>
      <body>
        {children}
        <Consent />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
