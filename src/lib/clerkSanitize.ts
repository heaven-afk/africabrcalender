// Helper to sanitize Clerk keys by trimming whitespace, trailing $, or quotes.
// NOTE: We cannot reassign process.env.NEXT_PUBLIC_* vars — Next.js inlines them
// as string literals at build time, making assignment a syntax error in the minifier.
// Instead, callers should use the returned values directly.

export function getSanitizedPublishableKey(): string {
  const raw = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  return raw.replace(/[$"'\s]+$/, "").trim();
}

export function getSanitizedSecretKey(): string {
  const raw = process.env.CLERK_SECRET_KEY ?? "";
  return raw.replace(/[$"'\s]+$/, "").trim();
}
