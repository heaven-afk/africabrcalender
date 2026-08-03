import { parsePublishableKey } from "@clerk/shared/keys";

/**
 * Sanitize a Clerk Publishable Key string
 */
export function sanitizeClerkKey(key: string | undefined): string {
  if (!key || typeof key !== "string") return "";
  return key
    .trim()
    .replace(/^["']|["']$/g, "") // Strip quotes
    .replace(/[\r\n\t]/g, "");   // Strip newlines/tabs
}

/**
 * Safely validate Clerk Publishable Key using Clerk's official key parser.
 * Prevents build-time and runtime throwInvalidPublishableKeyError crashes.
 */
export function isValidClerkPublishableKey(key: string | undefined): boolean {
  const k = sanitizeClerkKey(key);
  if (!k) return false;

  if (!k.startsWith("pk_test_") && !k.startsWith("pk_live_")) return false;
  if (k.includes("sample_key")) return false;

  try {
    const parsed = parsePublishableKey(k);
    return Boolean(parsed && parsed.frontendApi);
  } catch {
    // Retry with trailing '$' stripped if Vercel appended an extra '$'
    try {
      if (k.endsWith("$")) {
        const cleanKey = k.slice(0, -1);
        const parsed = parsePublishableKey(cleanKey);
        return Boolean(parsed && parsed.frontendApi);
      }
    } catch {
      return false;
    }
    return false;
  }
}
