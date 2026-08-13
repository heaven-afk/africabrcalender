import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";

const siteUrl = "https://esportscalendar.org";
const title = "Esports Calendar — Tournaments, Scrims, Rankings & Broadcasts";
const description = "Discover esports tournaments, rankings, scrims, awards and broadcasts in one global calendar. Follow event schedules and add them to your calendar.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: "%s | Esports Calendar" },
  description,
  applicationName: "Esports Calendar",
  authors: [{ name: "Esports Calendar", url: siteUrl }],
  creator: "Esports Calendar",
  publisher: "Esports Calendar",
  category: "esports",
  keywords: [
    "esports calendar",
    "esports tournaments",
    "gaming events",
    "tournament schedule",
    "esports scrims",
    "esports rankings",
    "competitive gaming",
    "esports broadcasts",
    "COD Mobile tournaments",
    "mobile esports",
  ],
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: false, address: false, email: false },
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png", sizes: "256x256" }],
    apple: [{ url: "/favicon.png", type: "image/png", sizes: "256x256" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title,
    description,
    url: "/",
    type: "website",
    locale: "en",
    siteName: "Esports Calendar",
    images: [{
      url: "/og.png",
      width: 1734,
      height: 907,
      type: "image/png",
      alt: "Esports Calendar — your esports calendar for tournaments, rankings, scrims, awards and broadcasts",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
  appleWebApp: {
    capable: true,
    title: "Esports Calendar",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#050606",
  colorScheme: "dark",
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Esports Calendar",
      url: siteUrl,
      logo: `${siteUrl}/favicon.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Esports Calendar",
      description,
      publisher: { "@id": `${siteUrl}/#organization` },
      inLanguage: "en",
    },
    {
      "@type": "WebApplication",
      name: "Esports Calendar",
      url: siteUrl,
      applicationCategory: "EntertainmentApplication",
      operatingSystem: "Any",
      description,
      isAccessibleForFree: true,
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <AnalyticsTracker />
        {children}
      </body>
    </html>
  );
}
