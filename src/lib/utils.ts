/**
 * Pure utility functions — safe to import in both client and server components
 * No Node.js / fs dependencies
 */
import { ScrimRecurrence } from "@/types/event";

/**
 * Generate months overlapping with [startDate, endDate] in format YYYY-MM
 */
export function getOverlappingMonths(startDate: string, endDate: string): string[] {
  const months: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return months;
  }

  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (current <= endMonth) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    months.push(`${year}-${month}`);
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

/**
 * Check if a date (YYYY-MM-DD) is an active scrim day
 */
export function isScrimActiveOnDate(
  dateStr: string,
  recurrence: ScrimRecurrence,
  startDate: string,
  endDate: string
): boolean {
  if (dateStr < startDate || dateStr > endDate) return false;
  if (recurrence.exceptions.includes(dateStr)) return false;
  const d = new Date(`${dateStr}T12:00:00Z`);
  const dayOfWeek = d.getUTCDay();
  return recurrence.daysOfWeek.includes(dayOfWeek);
}

/**
 * Extract 2-letter uppercase initials from Org Name
 */
export function getOrgInitials(orgName: string): string {
  if (!orgName) return "AF";
  const words = orgName.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}
