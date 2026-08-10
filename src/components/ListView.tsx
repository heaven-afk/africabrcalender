"use client";

import React from "react";
import { format, parseISO, isAfter, isBefore, startOfToday } from "date-fns";
import { CalendarDays, ChevronRight, Clock3, ExternalLink, MapPin, Radio, Trophy, Medal, Crosshair, Award, Mic2 } from "lucide-react";
import { CalendarEvent, EventCategory } from "@/types/event";
import { OrgLogo } from "./OrgLogo";

interface ListViewProps {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
}

const categoryMeta: Record<EventCategory, { label: string; icon: React.ElementType }> = {
  ranking: { label: "Ranking", icon: Medal },
  tournament: { label: "Tournament", icon: Trophy },
  scrim: { label: "Scrim", icon: Crosshair },
  award: { label: "Awards", icon: Award },
  podcast: { label: "Talk", icon: Mic2 },
};

function getStatus(evt: CalendarEvent): "live" | "upcoming" | "ended" {
  const today = startOfToday();
  const start = parseISO(evt.startDate);
  const end = parseISO(evt.endDate);
  if (isBefore(end, today)) return "ended";
  if (isAfter(start, today)) return "upcoming";
  return "live";
}

function dateParts(evt: CalendarEvent) {
  const start = parseISO(evt.startDate);
  const end = parseISO(evt.endDate);
  return {
    month: format(start, "MMM"),
    day: format(start, "d"),
    range: evt.startDate === evt.endDate ? format(start, "EEE, MMM d") : `${format(start, "MMM d")} – ${format(end, "MMM d")}`,
  };
}

export const ListView: React.FC<ListViewProps> = ({ events, onSelectEvent }) => {
  if (events.length === 0) {
    return <div className="empty-state"><CalendarDays /><h3>No events on the agenda</h3><p>Try another month or loosen the active filters.</p></div>;
  }

  return (
    <section className="agenda-view" aria-label="Event agenda">
      <header className="view-heading">
        <div><h2>Agenda</h2></div>
        <p><strong>{events.length}</strong> curated event{events.length === 1 ? "" : "s"}</p>
      </header>

      <div className="agenda-feed">
        {events.map((evt) => {
          const status = getStatus(evt);
          const date = dateParts(evt);
          const meta = categoryMeta[evt.category];
          const Icon = meta.icon;
          const externalUrl = evt.streamLinks?.[0]?.url || evt.location?.websiteUrl;

          return (
            <article key={evt.id} className={`agenda-item agenda-item--${evt.category}`}>
              <button className="agenda-item__main" onClick={() => onSelectEvent(evt)} aria-label={`Open ${evt.name}`}>
                <div className="agenda-date" aria-label={date.range}><span>{date.month}</span><strong>{date.day}</strong></div>
                <OrgLogo orgName={evt.orgName} logoUrl={evt.orgLogoUrl} size="md" />
                <div className="agenda-item__copy">
                  <div className="event-kicker"><Icon /><span>{meta.label}</span>{status === "live" && <em><i /> Live</em>}</div>
                  <h3>{evt.name}</h3>
                  <p><span>{evt.orgName}</span><i />{evt.game && <><span>{evt.game}</span><i /></>}<span>{date.range}</span></p>
                </div>
                <div className="agenda-item__details">
                  {evt.region && <span><MapPin />{evt.region}</span>}
                  {evt.stage && <span><Trophy />{evt.stage}</span>}
                  {(evt.startTime || evt.recurrence?.startTime) && <span><Clock3 />{evt.startTime || evt.recurrence?.startTime}{(evt.endTime || evt.recurrence?.endTime) ? `–${evt.endTime || evt.recurrence?.endTime}` : ""}</span>}
                </div>
                <span className="agenda-item__arrow"><ChevronRight /></span>
              </button>
              {externalUrl && <a className="agenda-item__external" href={externalUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${evt.name} link`}>{evt.streamLinks?.length ? <Radio /> : <ExternalLink />}</a>}
            </article>
          );
        })}
      </div>
    </section>
  );
};
