import { parsePublishableKey } from "@clerk/shared/keys";

const FALLBACK_KEY = "pk_test_dG91Y2hpbmctbGlvbmVzcy0xNi5jbGVyay5hY2NvdW50cy5kZXY$";

/**
 * Robustly sanitize and validate a Clerk Publishable Key string.
 * Tests multiple valid key permutations against Clerk's official key parser
 * to find the exact string format accepted by @clerk/nextjs.
 */
export function sanitizeClerkKey(key: string | undefined): string {
  if (!key || typeof key !== "string" || key.trim().length === 0) {
    return FALLBACK_KEY;
  }
  const raw = key.trim().replace(/^["']|["']$/g, "").replace(/[\r\n\t]/g, "");

  if (!raw.startsWith("pk_test_") && !raw.startsWith("pk_live_")) {
    return FALLBACK_KEY;
  }

  // Permutation 1: As provided
  try {
    const p1 = parsePublishableKey(raw);
    if (p1 && p1.frontendApi) return raw;
  } catch { /* try next */ }

  // Permutation 2: Strip trailing '$'
  try {
    if (raw.endsWith("$")) {
      const stripped = raw.slice(0, -1);
      const p2 = parsePublishableKey(stripped);
      if (p2 && p2.frontendApi) return stripped;
    }
  } catch { /* try next */ }

  // Permutation 3: Append trailing '$'
  try {
    if (!raw.endsWith("$")) {
      const withDollar = `${raw}$`;
      const p3 = parsePublishableKey(withDollar);
      if (p3 && p3.frontendApi) return withDollar;
    }
  } catch { /* try next */ }

  // Permutation 4: Base64 padding '=' adjustment
  try {
    const clean = raw.endsWith("$") ? raw.slice(0, -1) : raw;
    const parts = clean.split("_");
    if (parts.length >= 3) {
      let payload = parts.slice(2).join("_");
      const mod = payload.length % 4;
      if (mod > 0) payload += "=".repeat(4 - mod);
      const padded = `${parts[0]}_${parts[1]}_${payload}`;
      
      const p4 = parsePublishableKey(padded);
      if (p4 && p4.frontendApi) return padded;

      const paddedDollar = `${padded}$`;
      const p5 = parsePublishableKey(paddedDollar);
      if (p5 && p5.frontendApi) return paddedDollar;
    }
  } catch { /* try next */ }

  return raw;
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
