import type { Metadata } from "next";
import { ClerkErrorBoundary } from "@/components/ClerkErrorBoundary";
import { isValidClerkPublishableKey, sanitizeClerkKey } from "@/lib/clerkUtils";
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const rawKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const publishableKey = sanitizeClerkKey(rawKey);
  const validKey = isValidClerkPublishableKey(publishableKey);

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Oswald:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-neutral-100 antialiased selection:bg-gold-500 selection:text-black">
        {validKey ? (
          <ClerkErrorBoundary publishableKey={publishableKey}>
            {children}
          </ClerkErrorBoundary>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
