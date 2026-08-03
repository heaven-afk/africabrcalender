import { parsePublishableKey } from "@clerk/shared/keys";

/**
 * Safely validate Clerk Publishable Key using Clerk's official key parser.
 * Prevents build-time and runtime throwInvalidPublishableKeyError crashes.
 */
export function isValidClerkPublishableKey(key: string | undefined): boolean {
  if (!key || typeof key !== "string") return false;
  const k = key.trim();

  if (!k.startsWith("pk_test_") && !k.startsWith("pk_live_")) return false;
  if (k.includes("sample_key") || k.includes("\n") || k.includes("\r")) return false;

  try {
    const parsed = parsePublishableKey(k);
    return Boolean(parsed && parsed.frontendApi && parsed.publishableKey);
  } catch {
    return false;
  }
}
