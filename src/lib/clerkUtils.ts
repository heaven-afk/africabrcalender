import { parsePublishableKey } from "@clerk/shared/keys";

const DEFAULT_CLERK_KEY = "pk_test_dG91Y2hpbmctbGlvbmVzcy0xNi5jbGVyay5hY2NvdW50cy5kZXY$";

/**
 * Sanitize a Clerk Publishable Key string for Clerk SDK v5.
 * Ensures the publishable key retains its required '$' suffix.
 */
export function sanitizeClerkKey(key: string | undefined): string {
  if (!key || typeof key !== "string" || key.trim().length === 0) {
    return DEFAULT_CLERK_KEY;
  }
  let k = key.trim().replace(/^["']|["']$/g, "").replace(/[\r\n\t]/g, "");
  if ((k.startsWith("pk_test_") || k.startsWith("pk_live_")) && !k.endsWith("$")) {
    k = `${k}$`;
  }
  return k;
}

/**
 * Check if a Clerk publishable key is valid.
 */
export function isValidClerkPublishableKey(key: string | undefined): boolean {
  const k = sanitizeClerkKey(key);
  try {
    const parsed = parsePublishableKey(k);
    return Boolean(parsed && parsed.frontendApi);
  } catch {
    return false;
  }
}
