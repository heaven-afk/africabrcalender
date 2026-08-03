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
 * Safely validate Clerk Publishable Key string.
 * Accepts any key starting with pk_test_ or pk_live_.
 */
export function isValidClerkPublishableKey(key: string | undefined): boolean {
  const k = sanitizeClerkKey(key);
  if (!k) return false;
  if (k.includes("sample_key")) return false;
  return (k.startsWith("pk_test_") || k.startsWith("pk_live_")) && k.length > 20;
}
