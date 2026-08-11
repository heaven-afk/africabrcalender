"use client";

import React from "react";
import { format, parseISO } from "date-fns";
import { Trophy, Radio, ExternalLink, ChevronDown, ChevronRight, Medal, Crosshair, Award, Mic2, MapPin, CalendarDays, Layers3, Clock3 } from "lucide-react";
import { CalendarEvent, EventCategory } from "@/types/event";
import { OrgLogo } from "./OrgLogo";
import { isEventLive } from "@/lib/eventTiming";

interface TournamentsViewProps { events: CalendarEvent[]; now: Date; onSelectEvent: (e: CalendarEvent) => void; }
const categoryMeta: Record<EventCategory, { label: string; icon: React.ElementType }> = {
  ranking: { label: "Ranking", icon: Medal }, tournament: { label: "Tournament", icon: Trophy }, scrim: { label: "Scrim", icon: Crosshair }, award: { label: "Awards", icon: Award }, podcast: { label: "Talk", icon: Mic2 },
};
const formatRange = (evt: CalendarEvent) => {
  const start = parseISO(evt.startDate); const end = parseISO(evt.endDate);
  return evt.startDate === evt.endDate ? format(start, "MMM d, yyyy") : `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
};

export const TournamentsView: React.FC<TournamentsViewProps> = ({ events, now, onSelectEvent }) => {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const grouped = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((evt) => map.set(evt.name, [...(map.get(evt.name) || []), evt]));
    return Array.from(map.entries()).sort((a, b) => (a[1][0]?.startDate || "").localeCompare(b[1][0]?.startDate || ""));
  }, [events]);
  const toggle = (name: string) => setExpanded((current) => {
    const next = new Set(current);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    return next;
  });

  if (!events.length) return <div className="empty-state"><Trophy /><h3>No competitions found</h3><p>Try another month or loosen the active filters.</p></div>;

  return (
    <section className="events-view" aria-label="All competitions">
      <header className="view-heading"><div><h2>Events</h2></div><p><strong>{grouped.length}</strong> event series</p></header>
      <div className="series-grid">
        {grouped.map(([name, group]) => {
          const event = group[0]; const open = expanded.has(name); const multi = group.length > 1;
          const meta = categoryMeta[event.category]; const Icon = meta.icon;
          const stream = event.streamLinks?.[0]?.url;
          return (
            <article key={name} className={`series-card series-card--${event.category} ${open ? "is-open" : ""}`}>
              <button className="series-card__main" onClick={() => multi ? toggle(name) : onSelectEvent(event)} aria-expanded={multi ? open : undefined}>
                <div className="series-card__top"><span className="series-category"><Icon />{meta.label}{group.some((item) => isEventLive(item, now)) && <em className="view-live-status"><i />Live</em>}</span><span className="series-date"><CalendarDays />{formatRange(event)}</span></div>
                <div className="series-card__identity"><OrgLogo orgName={event.orgName} logoUrl={event.orgLogoUrl} size="lg" /><div><h3>{name}</h3><p>{event.orgName}</p></div></div>
                <div className="series-card__meta">
                  {event.region && <span><MapPin />{event.region}</span>}
                  {event.game && <span><Trophy />{event.game}</span>}
                  {(event.startTime || event.recurrence?.startTime) && <span><Clock3 />{event.startTime || event.recurrence?.startTime}{(event.endTime || event.recurrence?.endTime) ? `–${event.endTime || event.recurrence?.endTime}` : ""}</span>}
                  {multi && <span><Layers3 />{group.length} stages</span>}
                </div>
              </button>
              <div className="series-card__actions">
                <button type="button" onClick={() => multi ? toggle(name) : onSelectEvent(event)}>
                  <span>{multi ? (open ? "Hide stages" : "View stages") : "Open event"}</span>
                  {multi ? <ChevronDown /> : <ChevronRight />}
                </button>
                {stream && <a className="series-card__stream" href={stream} target="_blank" rel="noopener noreferrer"><Radio />Watch stream<ExternalLink /></a>}
              </div>
              {open && multi && <div className="series-stages">{group.map((evt, index) => <button key={evt.id} onClick={() => onSelectEvent(evt)}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{evt.stage || evt.name}{isEventLive(evt, now) && <em className="view-live-status"><i />Live</em>}</strong><small>{formatRange(evt)}</small></div><ChevronRight /></button>)}</div>}
            </article>
          );
        })}
      </div>
    </section>
  );
};
