import { CalendarEvent } from "../types/event";
import { isScrimActiveOnDate } from "./utils";

export type EventTimingStatus = "live" | "upcoming" | "past";

export interface ZonedClock {
  date: string;
  minutes: number;
}

export function getEventTimezone(event: CalendarEvent): string {
  return event.recurrence?.timezone || event.location?.timezone || "UTC";
}

export function getTimezoneLabel(timezone: string, date = new Date()): string {
  try {
    const label = new Intl.DateTimeFormat("en-NG", {
      timeZone: timezone,
      timeZoneName: "short",
    })
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName")?.value;

    return label || timezone;
  } catch {
    return timezone;
  }
}

export function getEventTimes(event: CalendarEvent) {
  return {
    startTime: event.startTime || event.recurrence?.startTime || null,
    endTime: event.endTime || event.recurrence?.endTime || null,
  };
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function getZonedClock(now: Date, timezone: string): ZonedClock {
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
  } catch {
    return getZonedClock(now, "UTC");
  }

  const parts = formatter.formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || "00";
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    minutes: Number(value("hour")) * 60 + Number(value("minute")),
  };
}

function addDays(date: string, amount: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + amount));
  return next.toISOString().slice(0, 10);
}

function hasFutureRecurringOccurrence(event: CalendarEvent, date: string): boolean {
  const recurrence = event.recurrence;
  if (!recurrence || date >= event.endDate) return false;
  const exceptions = new Set(recurrence.exceptions || []);
  const [year, month, day] = date.split("-").map(Number);
  const todayWeekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  return recurrence.daysOfWeek.some((weekday) => {
    let offset = (weekday - todayWeekday + 7) % 7;
    if (offset === 0) offset = 7;
    let candidate = addDays(date, offset);
    if (candidate < event.startDate) candidate = event.startDate;

    while (candidate <= event.endDate) {
      const candidateDay = new Date(`${candidate}T12:00:00Z`).getUTCDay();
      if (candidateDay === weekday && !exceptions.has(candidate)) return true;
      candidate = addDays(candidate, candidateDay === weekday ? 7 : 1);
    }
    return false;
  });
}

function getRecurringStatus(event: CalendarEvent, clock: ZonedClock): EventTimingStatus {
  const recurrence = event.recurrence!;
  const start = timeToMinutes(recurrence.startTime);
  const end = timeToMinutes(recurrence.endTime || "23:59");
  const activeToday = isScrimActiveOnDate(clock.date, recurrence, event.startDate, event.endDate);
  const previousDate = addDays(clock.date, -1);
  const activeYesterday = isScrimActiveOnDate(previousDate, recurrence, event.startDate, event.endDate);
  const overnight = end <= start;
  const live = overnight
    ? (activeToday && clock.minutes >= start) || (activeYesterday && clock.minutes < end)
    : activeToday && clock.minutes >= start && clock.minutes < end;

  if (live) return "live";
  if (clock.date < event.startDate) return "upcoming";
  if (clock.date > event.endDate) return "past";
  if (activeToday && clock.minutes < start) return "upcoming";
  return hasFutureRecurringOccurrence(event, clock.date) ? "upcoming" : "past";
}

export function getEventTimingStatus(event: CalendarEvent, now = new Date()): EventTimingStatus {
  const clock = getZonedClock(now, getEventTimezone(event));
  if (event.recurrence) return getRecurringStatus(event, clock);

  const { startTime, endTime } = getEventTimes(event);
  if (!startTime && !endTime) {
    if (clock.date < event.startDate) return "upcoming";
    if (clock.date > event.endDate) return "past";
    return "live";
  }

  const startMinutes = startTime ? timeToMinutes(startTime) : 0;
  const endMinutes = endTime ? timeToMinutes(endTime) : 1440;
  const overnight = Boolean(startTime && endTime && endMinutes <= startMinutes);
  const activeToday = clock.date >= event.startDate && clock.date <= event.endDate;
  const previousDate = addDays(clock.date, -1);
  const activeYesterday = previousDate >= event.startDate && previousDate <= event.endDate;

  const live = overnight
    ? (activeToday && clock.minutes >= startMinutes) ||
      (activeYesterday && clock.minutes < endMinutes)
    : activeToday && clock.minutes >= startMinutes && clock.minutes < endMinutes;

  if (live) return "live";
  if (clock.date < event.startDate) return "upcoming";
  if (activeToday && clock.minutes < startMinutes) return "upcoming";
  if (clock.date < event.endDate) return "upcoming";
  if (overnight && clock.date === addDays(event.endDate, 1) && clock.minutes < endMinutes) {
    return "upcoming";
  }
  return "past";
}

export function isEventLive(event: CalendarEvent, now = new Date()): boolean {
  return getEventTimingStatus(event, now) === "live";
}

export function isEventOccurrenceLive(
  event: CalendarEvent,
  occurrenceDate: string,
  now = new Date(),
): boolean {
  const clock = getZonedClock(now, getEventTimezone(event));
  return occurrenceDate === clock.date && isEventLive(event, now);
}
