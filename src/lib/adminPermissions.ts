/**
 * Admin authorization and permission checks
 */

/**
 * List of allowed admin email addresses.
 * Can be configured via NEXT_PUBLIC_ADMIN_EMAILS environment variable (comma-separated).
 */
export function getAuthorizedAdminEmails(): string[] {
  const envEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || "";
  if (envEmails.trim().length > 0) {
    return envEmails
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  }
  // Default list of allowed admin emails if env variable is not set
  return [];
}

/**
 * Check if a given user email address is an authorized admin.
 * If no admin list is defined, returns true for any signed-in user or dev admin.
 */
export function isAuthorizedAdminEmail(userEmail: string | null | undefined): boolean {
  if (!userEmail) return false;
  const email = userEmail.trim().toLowerCase();
  const allowedEmails = getAuthorizedAdminEmails();

  // If specific emails are configured, strictly check against that list
  if (allowedEmails.length > 0) {
    return allowedEmails.includes(email);
  }

  // If no admin emails restriction is set, allow any authenticated email
  return true;
}
