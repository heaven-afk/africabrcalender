import { parsePublishableKey } from "@clerk/shared/keys";

const DEFAULT_CLERK_KEY = "pk_test_dG91Y2hpbmctbGlvbmVzcy0xNi5jbGVyay5hY2NvdW50cy5kZXYk";

/**
 * Return trimmed Clerk Publishable Key string directly without mutation.
 */
export function sanitizeClerkKey(key: string | undefined): string {
  if (!key || typeof key !== "string" || key.trim().length === 0) {
    return DEFAULT_CLERK_KEY;
  }
  const trimmed = key.trim().replace(/^["']|["']$/g, "").replace(/[\r\n\t]/g, "");
  if (!trimmed.startsWith("pk_test_") && !trimmed.startsWith("pk_live_")) {
    return DEFAULT_CLERK_KEY;
  }
  return trimmed;
}

/**
 * Check if a Clerk publishable key is valid.
 */
export function isValidClerkPublishableKey(key: string | undefined): boolean {
  const sanitizedKey = sanitizeClerkKey(key);
  try {
    const parsed = parsePublishableKey(sanitizedKey);
    return Boolean(parsed && parsed.frontendApi);
  } catch {
    return false;
  }
}
