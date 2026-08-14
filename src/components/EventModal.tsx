"use client";

import React, { useEffect } from "react";
import {
  X, CalendarDays, Clock3, Tv, ExternalLink, AlignLeft,
  Globe2, Gamepad2, MapPin, Building2, ArrowUpRight,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { CalendarEvent } from "@/types/event";
import { CategoryPill } from "./CategoryPill";
import { OrgLogo } from "./OrgLogo";
import { getStreamPlatform } from "@/lib/eventCatalog";
import { getEventTimingStatus, isEventOccurrenceLive } from "@/lib/eventTiming";

interface EventModalProps { event: CalendarEvent | null; occurrenceDate?: string | null; now: Date; onClose: () => void; }
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatDateRange(event: CalendarEvent) {
  if (event.recurrence?.daysOfWeek?.length === 7 && event.endDate === "2099-12-31") return "Every day";
  try {
    const start = format(parseISO(event.startDate), "MMM d, yyyy");
    const end = format(parseISO(event.endDate), "MMM d, yyyy");
    return start === end ? start : `${start} — ${end}`;
  } catch { return `${event.startDate} — ${event.endDate}`; }
}

export const EventModal: React.FC<EventModalProps> = ({ event, occurrenceDate, now, onClose }) => {
  useEffect(() => {
    if (!event) return;
    const onKey = (keyEvent: KeyboardEvent) => { if (keyEvent.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [event, onClose]);

  if (!event) return null;
  const primaryLink = event.streamLinks?.[0]?.url || event.location?.websiteUrl;
  const timezone = event.recurrence?.timezone || event.location?.timezone;
  const live = occurrenceDate
    ? isEventOccurrenceLive(event, occurrenceDate, now)
    : getEventTimingStatus(event, now) === "live";

  return (
    <div className="drawer-backdrop animate-fadeIn" onMouseDown={onClose}>
      <aside className="event-drawer" role="dialog" aria-modal="true" aria-labelledby="event-drawer-title" onMouseDown={(e) => e.stopPropagation()}>
        <header className="drawer-header">
          <span>Event details</span>
          <button onClick={onClose} aria-label="Close event details"><X /></button>
        </header>

        <div className="event-drawer__body">
          <div className="event-drawer__identity">
            <OrgLogo orgName={event.orgName} logoUrl={event.orgLogoUrl} size="lg" />
            <div>
              <div className="event-drawer__labels"><CategoryPill category={event.category} size="sm" />{live && <span className="view-live-status"><i />Live now</span>}</div>
              <h2 id="event-drawer-title">{event.name}</h2>
              {event.stage && <p>{event.stage}</p>}
            </div>
          </div>

          <div className="event-facts">
            <div><span><CalendarDays />Schedule</span><strong>{formatDateRange(event)}</strong></div>
            {(event.startTime || event.recurrence?.startTime) && <div><span><Clock3 />Time</span><strong>{event.startTime || event.recurrence?.startTime}{(event.endTime || event.recurrence?.endTime) ? `–${event.endTime || event.recurrence?.endTime}` : ""}{timezone ? ` · ${timezone}` : ""}</strong></div>}
            <div><span><Building2 />Organizer</span><strong>{event.orgName}</strong></div>
            {event.game && <div><span><Gamepad2 />Game</span><strong>{event.game}</strong></div>}
            {event.region && <div><span><MapPin />Region</span><strong>{event.region}</strong></div>}
          </div>

          {(event.description || event.location?.note) && (
            <section className="drawer-section event-description">
              <div className="drawer-section__title"><AlignLeft /><span>About this event</span></div>
              <p>{event.description || event.location.note}</p>
            </section>
          )}

          {event.recurrence && (
            <section className="drawer-section">
              <div className="drawer-section__title"><Clock3 /><span>Recurring schedule</span></div>
              <p>{event.recurrence.daysOfWeek.map((day) => DAYS[day]).join(", ")}</p>
              <strong>{event.recurrence.startTime}–{event.recurrence.endTime} · {event.recurrence.timezone || "UTC"}</strong>
            </section>
          )}

          {event.streamLinks?.length > 0 && (
            <section className="drawer-section">
              <div className="drawer-section__title"><Tv /><span>Broadcasts</span></div>
              <div className="drawer-links">
                {event.streamLinks.map((stream, index) => { const platform = getStreamPlatform(stream.label, stream.url); return (
                  <a key={index} href={stream.url} target="_blank" rel="noopener noreferrer">
                    <span>{platform.logo ? <>{/* eslint-disable-next-line @next/next/no-img-element */}<img className="stream-mark" src={platform.logo} alt="" /></> : <Tv />}{platform.label}</span><ExternalLink />
                  </a>
                ); })}
              </div>
            </section>
          )}

          {(event.location?.discordUrl || event.location?.websiteUrl) && (
            <section className="drawer-section">
              <div className="drawer-section__title"><Globe2 /><span>Official links</span></div>
              <div className="drawer-links">
                {event.location.discordUrl && <a href={event.location.discordUrl} target="_blank" rel="noopener noreferrer"><span>{/* eslint-disable-next-line @next/next/no-img-element */}<img className="discord-mark" src="https://cdn.simpleicons.org/discord/5865F2" alt="" /> Discord</span><ExternalLink /></a>}
                {event.location.websiteUrl && <a href={event.location.websiteUrl} target="_blank" rel="noopener noreferrer"><span><Globe2 /> Website</span><ExternalLink /></a>}
              </div>
            </section>
          )}
        </div>

        <footer className="drawer-footer">
          <button onClick={onClose}>Close</button>
          {primaryLink && <a href={primaryLink} target="_blank" rel="noopener noreferrer">Open official link <ArrowUpRight /></a>}
        </footer>
      </aside>
    </div>
  );
};
