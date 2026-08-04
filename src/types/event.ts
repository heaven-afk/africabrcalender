export type EventCategory = "ranking" | "tournament" | "scrim" | "award" | "podcast";

export interface StreamLink {
  label?: string;
  url: string;
}

export interface EventLocation {
  discordUrl?: string;
  websiteUrl?: string;
  note?: string;
}

export interface ScrimRecurrence {
  daysOfWeek: number[]; // 0 = Sunday, 1 = Monday ... 6 = Saturday
  startTime: string; // "19:00" (24h format)
  endTime: string; // "21:00" (24h format)
  timezone: string; // IANA tz e.g. "Africa/Lagos"
  exceptions: string[]; // YYYY-MM-DD strings to skip
}

export interface CalendarEvent {
  id: string;
  name: string;
  category: EventCategory;
  game?: string | null;
  stage: string | null;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  orgName: string;
  orgLogoUrl: string | null;
  region: string | null;
  streamLinks: StreamLink[];
  location: EventLocation;
  recurrence: ScrimRecurrence | null;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  status?: "approved" | "pending" | "rejected";
  submitterEmail?: string;
  submittedAt?: string;
}

export interface EventFilterOptions {
  search: string;
  categories: EventCategory[];
  region: string | null;
  month: string; // YYYY-MM
}

