import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Esports Calendar — Every tournament, one schedule",
  description:
    "A global calendar for esports tournaments, rankings, scrims, broadcasts, awards, and community events.",
  keywords: [
    "Esports Calendar",
    "Esports Calendar",
    "CODM BR",
    "Battle Royale Tournaments",
    "Global Esports",
    "Scrim Schedule",
    "Ranking Ladder",
  ],
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
      <body>
        {children}
      </body>
    </html>
  );
}
