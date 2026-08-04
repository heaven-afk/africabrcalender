import { parsePublishableKey } from "@clerk/shared/keys";

const DEFAULT_CLERK_KEY = "pk_test_dG91Y2hpbmctbGlvbmVzcy0xNi5jbGVyay5hY2NvdW50cy5kZXY=$";

/**
 * Sanitize a Clerk Publishable Key string.
 * Fixes unpadded Base64 strings to prevent 'atob' Window decoding exceptions.
 */
export function sanitizeClerkKey(key: string | undefined): string {
  if (!key || typeof key !== "string" || key.trim().length === 0) {
    return DEFAULT_CLERK_KEY;
  }
  let k = key.trim().replace(/^["']|["']$/g, "").replace(/[\r\n\t]/g, "");

  if (!k.startsWith("pk_test_") && !k.startsWith("pk_live_")) {
    return DEFAULT_CLERK_KEY;
  }

  // Remove trailing '$' for payload inspection
  if (k.endsWith("$")) {
    k = k.slice(0, -1);
  }

  // Add missing Base64 '=' padding if needed
  const parts = k.split("_");
  if (parts.length >= 3) {
    let payload = parts.slice(2).join("_");
    const mod = payload.length % 4;
    if (mod > 0) {
      payload += "=".repeat(4 - mod);
    }
    k = `${parts[0]}_${parts[1]}_${payload}`;
  }

  return `${k}$`;
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
