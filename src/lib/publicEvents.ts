import type { CalendarEvent } from "@/types/event";

/**
 * Return the approved event data that is safe to expose to public clients.
 * Submission and audit metadata must remain available only to admin routes.
 */
export function getPublicEvents(events: CalendarEvent[]): CalendarEvent[] {
  return events
    .filter((event) => !event.status || event.status === "approved")
    .map((event) => {
      const publicEvent = { ...event };

      delete publicEvent.createdBy;
      delete publicEvent.updatedAt;
      delete publicEvent.updatedBy;
      delete publicEvent.status;
      delete publicEvent.submitterEmail;
      delete publicEvent.submittedAt;

      return publicEvent;
    });
}
