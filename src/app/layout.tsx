import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Africa BR Calendar — Battle Royale Esports Community Calendar",
  description:
    "Official Battle Royale esports tournament, ranking ladder, and daily scrim schedule directory for African esports teams and organizations.",
  keywords: [
    "Africa BR",
    "Esports Calendar",
    "CODM BR",
    "Battle Royale Tournaments",
    "Africa Esports",
    "Scrim Schedule",
    "Ranking Ladder",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0a0a0c",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Oswald:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-neutral-100 antialiased selection:bg-gold-500 selection:text-black min-h-screen overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
