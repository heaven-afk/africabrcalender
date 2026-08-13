import { CalendarEvent } from "../types/event";
import { getEventTimes, getEventTimezone } from "./eventTiming";

const DAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

function addDays(date: string, amount: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + amount)).toISOString().slice(0, 10);
}

function compactDate(date: string): string {
  return date.replaceAll("-", "");
}

function compactLocal(date: string, time: string): string {
  return `${compactDate(date)}T${time.replace(":", "")}00`;
}

function formatUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeText(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,");
}

function zonedDateTimeToUtc(date: string, time: string, timezone: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const desired = Date.UTC(year, month - 1, day, hour, minute);
  let guess = desired;

  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const parts = formatter.formatToParts(new Date(guess));
      const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value || 0);
      const displayed = Date.UTC(value("year"), value("month") - 1, value("day"), value("hour"), value("minute"));
      guess += desired - displayed;
    }
  } catch {
    // Invalid or unavailable IANA timezone: preserve the supplied wall time as UTC.
  }
  return new Date(guess);
}

function firstRecurringDate(event: CalendarEvent): string | null {
  const recurrence = event.recurrence;
  if (!recurrence) return null;
  const exceptions = new Set(recurrence.exceptions || []);
  let candidate = event.startDate;
  while (candidate <= event.endDate) {
    const weekday = new Date(`${candidate}T12:00:00Z`).getUTCDay();
    if (recurrence.daysOfWeek.includes(weekday) && !exceptions.has(candidate)) return candidate;
    candidate = addDays(candidate, 1);
  }
  return null;
}

function eventLines(event: CalendarEvent, stamp: string): string[] {
  const timezone = getEventTimezone(event);
  const { startTime, endTime } = getEventTimes(event);
  const summary = `${event.name}${event.stage ? ` - ${event.stage}` : ""}`;
  const description = [
    `Organized by: ${event.orgName}`,
    event.region ? `Region: ${event.region}` : "",
    `Type: ${event.category.toUpperCase()}`,
    event.streamLinks?.[0]?.url ? `Stream: ${event.streamLinks[0].url}` : "",
  ].filter(Boolean).join("\n");
  const lines = [
    "BEGIN:VEVENT",
    `UID:${escapeText(event.id)}@africabr.calendar`,
    `DTSTAMP:${stamp}`,
    `SUMMARY:${escapeText(summary)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `CATEGORIES:${escapeText(event.category.toUpperCase())}`,
  ];

  const officialUrl = event.streamLinks?.[0]?.url || event.location?.websiteUrl;
  if (officialUrl) lines.push(`URL:${officialUrl}`);

  if (event.recurrence) {
    const firstDate = firstRecurringDate(event);
    if (!firstDate) return [];
    const recurrenceStart = event.recurrence.startTime;
    const recurrenceEnd = event.recurrence.endTime || "23:59";
    let endDate = firstDate;
    if (recurrenceEnd <= recurrenceStart) endDate = addDays(endDate, 1);
    lines.push(`DTSTART;TZID=${timezone}:${compactLocal(firstDate, recurrenceStart)}`);
    lines.push(`DTEND;TZID=${timezone}:${compactLocal(endDate, recurrenceEnd)}`);
    const byDay = event.recurrence.daysOfWeek.map((day) => DAY_CODES[day]).join(",");
    const until = formatUtc(zonedDateTimeToUtc(event.endDate, "23:59", timezone));
    lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${byDay};UNTIL=${until}`);
    for (const exception of event.recurrence.exceptions || []) {
      lines.push(`EXDATE;TZID=${timezone}:${compactLocal(exception, recurrenceStart)}`);
    }
  } else if (startTime) {
    let endDate = event.endDate;
    const finalTime = endTime || "23:59";
    if (event.startDate === event.endDate && endTime && finalTime <= startTime) endDate = addDays(endDate, 1);
    lines.push(`DTSTART:${formatUtc(zonedDateTimeToUtc(event.startDate, startTime, timezone))}`);
    lines.push(`DTEND:${formatUtc(zonedDateTimeToUtc(endDate, finalTime, timezone))}`);
  } else {
    lines.push(`DTSTART;VALUE=DATE:${compactDate(event.startDate)}`);
    lines.push(`DTEND;VALUE=DATE:${compactDate(addDays(event.endDate, 1))}`);
  }

  lines.push("END:VEVENT");
  return lines;
}

function foldLine(line: string): string[] {
  if (line.length <= 72) return [line];
  const parts: string[] = [];
  let remaining = line;
  while (remaining.length > 72) {
    parts.push(`${parts.length ? " " : ""}${remaining.slice(0, parts.length ? 71 : 72)}`);
    remaining = remaining.slice(parts.length === 1 ? 72 : 71);
  }
  parts.push(`${parts.length ? " " : ""}${remaining}`);
  return parts;
}

export function getMonthlyExportEvents(events: CalendarEvent[], month: string): CalendarEvent[] {
  if (!/^\d{4}-\d{2}$/.test(month)) return [];
  const [year, monthNumber] = month.split("-").map(Number);
  const finalDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const monthStart = `${month}-01`;
  const monthEnd = `${month}-${String(finalDay).padStart(2, "0")}`;

  return events
    .filter((event) => event.startDate <= monthEnd && event.endDate >= monthStart)
    .map((event) => event.recurrence ? {
      ...event,
      startDate: event.startDate < monthStart ? monthStart : event.startDate,
      endDate: event.endDate > monthEnd ? monthEnd : event.endDate,
    } : event);
}

export function generateICS(
  events: CalendarEvent[],
  generatedAt = new Date(),
  calendarName = "Esports Calendar",
): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Esports Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
  ];
  const stamp = formatUtc(generatedAt);
  for (const event of events) lines.push(...eventLines(event, stamp));
  lines.push("END:VCALENDAR");
  return lines.flatMap(foldLine).join("\r\n") + "\r\n";
}
