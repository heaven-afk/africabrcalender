import type { Metadata } from "next";
import dynamic from "next/dynamic";
import "./globals.css";

// Load ClerkProvider only on the client (ssr: false) so the server never
// imports @clerk/nextjs — this prevents atob() crashing on a malformed key.
const ClerkProviderWrapper = dynamic(
  () =>
    import("@/components/ClerkProviderWrapper").then(
      (m) => m.ClerkProviderWrapper
    ),
  { ssr: false }
);

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
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const isValidClerkKey =
    publishableKey.startsWith("pk_") &&
    !publishableKey.includes("sample_key") &&
    !publishableKey.includes("\n") &&
    !publishableKey.includes("\r");

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
        {isValidClerkKey ? (
          <ClerkProviderWrapper publishableKey={publishableKey}>
            {children}
          </ClerkProviderWrapper>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
