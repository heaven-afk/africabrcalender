/**
 * Safely validate Clerk Publishable Key before passing to ClerkProvider
 * Prevents build-time and runtime throwInvalidPublishableKeyError crashes.
 */
export function isValidClerkPublishableKey(key: string | undefined): boolean {
  if (!key || typeof key !== "string") return false;
  const k = key.trim();

  // Basic prefix check
  if (!k.startsWith("pk_test_") && !k.startsWith("pk_live_")) return false;

  // Reject dummy/sample keys or newline corruption
  if (k.includes("sample_key") || k.includes("\n") || k.includes("\r")) return false;

  // Reject keys ending with a trailing '$' without payload (corrupted env var)
  if (k.endsWith("$")) return false;

  try {
    // Parse key payload
    const payload = k.replace(/^pk_(test|live)_/, "");
    if (!payload || payload.length < 8) return false;

    // Decode base64 payload up to '$' delimiter
    const base64Payload = payload.split("$")[0];
    if (!base64Payload || base64Payload.length < 8) return false;

    // Test base64 decoding (will throw if malformed base64)
    const decoded = typeof window !== "undefined" ? atob(base64Payload) : Buffer.from(base64Payload, "base64").toString("binary");
    return decoded.length > 0;
  } catch {
    return false;
  }
}
