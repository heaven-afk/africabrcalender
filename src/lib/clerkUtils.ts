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
 * Safely validate Clerk Publishable Key string using Clerk's official key parser.
 * Returns true ONLY if parsePublishableKey succeeds.
 */
export function isValidClerkPublishableKey(key: string | undefined): boolean {
  const k = sanitizeClerkKey(key);
  if (!k) return false;
  if (k.includes("sample_key")) return false;

  try {
    const parsed = parsePublishableKey(k);
    return Boolean(parsed && parsed.frontendApi);
  } catch {
    return false;
  }
}
