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

interface EventModalProps { event: CalendarEvent | null; onClose: () => void; }
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatDateRange(event: CalendarEvent) {
  try {
    const start = format(parseISO(event.startDate), "MMM d, yyyy");
    const end = format(parseISO(event.endDate), "MMM d, yyyy");
    return start === end ? start : `${start} — ${end}`;
  } catch { return `${event.startDate} — ${event.endDate}`; }
}

export const EventModal: React.FC<EventModalProps> = ({ event, onClose }) => {
  useEffect(() => {
    if (!event) return;
    const onKey = (keyEvent: KeyboardEvent) => { if (keyEvent.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [event, onClose]);

  if (!event) return null;
  const primaryLink = event.streamLinks?.[0]?.url || event.location?.websiteUrl;

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
              <CategoryPill category={event.category} size="sm" />
              <h2 id="event-drawer-title">{event.name}</h2>
              {event.stage && <p>{event.stage}</p>}
            </div>
          </div>

          <div className="event-meta-grid">
            <div><CalendarDays /><span>Schedule<strong>{formatDateRange(event)}</strong></span></div>
            <div><Building2 /><span>Organizer<strong>{event.orgName}</strong></span></div>
            {event.game && <div><Gamepad2 /><span>Game<strong>{event.game}</strong></span></div>}
            {event.region && <div><MapPin /><span>Region<strong>{event.region}</strong></span></div>}
            {(event.startTime || event.recurrence?.startTime) && <div><Clock3 /><span>Time<strong>{event.startTime || event.recurrence?.startTime}{(event.endTime || event.recurrence?.endTime) ? `–${event.endTime || event.recurrence?.endTime}` : ""}</strong></span></div>}
          </div>

          {(event.description || event.location?.note) && (
            <section className="drawer-section event-description">
              <div className="drawer-section__title"><AlignLeft /><span>About this event</span></div>
              <p>{event.description || event.location.note}</p>
            </section>
          )}

          {event.category === "scrim" && event.recurrence && (
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
                {event.streamLinks.map((stream, index) => (
                  <a key={index} href={stream.url} target="_blank" rel="noopener noreferrer">
                    <span>{stream.label || "Watch broadcast"}</span><ExternalLink />
                  </a>
                ))}
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
