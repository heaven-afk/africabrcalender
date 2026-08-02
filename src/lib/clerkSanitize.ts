// Helper to sanitize Clerk keys by trimming whitespace, trailing $, or quotes
export function sanitizeClerkKeys() {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    let key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.trim();
    // Remove accidental trailing $ or quotes
    key = key.replace(/[$"']+$/, "").trim();
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = key;
  }

  if (process.env.CLERK_SECRET_KEY) {
    let key = process.env.CLERK_SECRET_KEY.trim();
    key = key.replace(/[$"']+$/, "").trim();
    process.env.CLERK_SECRET_KEY = key;
  }
}

// Automatically execute on import
sanitizeClerkKeys();
