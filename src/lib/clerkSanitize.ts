// Sanitize Clerk env vars at server startup.
// IMPORTANT: Only run this in server-side / Node.js contexts.
// Next.js inlines NEXT_PUBLIC_* values in CLIENT bundles as string literals,
// so we guard with a typeof check to avoid a Terser syntax error.

if (typeof process !== "undefined" && process.env) {
  // Sanitize publishable key (safe to mutate in server context)
  const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (pubKey) {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pubKey
      .replace(/[$"'\s]+$/, "")
      .trim();
  }

  // Sanitize secret key
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (secretKey) {
    process.env.CLERK_SECRET_KEY = secretKey
      .replace(/[$"'\s]+$/, "")
      .trim();
  }
}
