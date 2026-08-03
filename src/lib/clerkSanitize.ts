// clerkSanitize.ts
// NOTE: NEXT_PUBLIC_* env vars are inlined as string literals by Next.js webpack at
// build time. Reassigning process.env.NEXT_PUBLIC_* is impossible — it becomes an
// invalid assignment to a string literal in the compiled output.
//
// If your Clerk keys have trailing whitespace/special characters, fix them directly
// in your Vercel Environment Variables dashboard (Settings → Environment Variables).
// No runtime sanitization is needed or possible for NEXT_PUBLIC_* variables.
