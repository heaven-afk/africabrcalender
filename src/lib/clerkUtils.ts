import { parsePublishableKey } from "@clerk/shared/keys";

const DEFAULT_CLERK_KEY = "pk_test_dG91Y2hpbmctbGlvbmVzcy0xNi5jbGVyay5hY2NvdW50cy5kZXY";

/**
 * Sanitize a Clerk Publishable Key string.
 * Strips quotes, newlines, and trailing '$' characters.
 * Defaults to valid key if environment variable is missing or corrupted.
 */
export function sanitizeClerkKey(key: string | undefined): string {
  if (!key || typeof key !== "string" || key.trim().length === 0) {
    return DEFAULT_CLERK_KEY;
  }
  let k = key.trim().replace(/^["']|["']$/g, "").replace(/[\r\n\t]/g, "");
  if (k.endsWith("$")) {
    k = k.slice(0, -1);
  }
  if (!k.startsWith("pk_test_") && !k.startsWith("pk_live_")) {
    return DEFAULT_CLERK_KEY;
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
