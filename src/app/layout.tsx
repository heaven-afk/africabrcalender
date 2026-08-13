import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";

const title = "Esports Calendar — Your esports calendar";
const description = "Discover and track esports tournaments, rankings, scrims, awards and broadcasts in one schedule.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Esports Calendar",
    "CODM BR",
    "Battle Royale Tournaments",
    "Global Esports",
    "Scrim Schedule",
    "Ranking Ladder",
  ],
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png", sizes: "256x256" }],
    apple: [{ url: "/favicon.png", type: "image/png", sizes: "256x256" }],
  },
  openGraph: {
    title,
    description,
    type: "website",
    siteName: "Esports Calendar",
    images: [{
      url: "/og.png",
      width: 1729,
      height: 910,
      alt: "Esports Calendar — Your esports calendar",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#050606",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body><AnalyticsTracker />{children}</body>
    </html>
  );
}
