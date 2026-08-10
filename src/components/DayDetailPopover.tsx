"use client";

import React from "react";
import { format, parseISO } from "date-fns";
import { X, Tv, ArrowUpRight, CalendarDays, Medal, Trophy, Crosshair, Award, Mic2 } from "lucide-react";
import { CalendarEvent } from "@/types/event";

interface DayDetailPopoverProps {
  date: string | null;
  events: CalendarEvent[];
  onClose: () => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

const ICONS = { ranking: Medal, tournament: Trophy, scrim: Crosshair, award: Award, podcast: Mic2 };

export const DayDetailPopover: React.FC<DayDetailPopoverProps> = ({ date, events, onClose, onSelectEvent }) => {
  if (!date) return null;
  return (
    <div className="drawer-backdrop animate-fadeIn" onMouseDown={onClose}>
      <aside className="day-drawer" role="dialog" aria-modal="true" aria-labelledby="day-drawer-title" onMouseDown={(e) => e.stopPropagation()}>
        <header className="drawer-header">
          <span><CalendarDays /> Day schedule</span>
          <button onClick={onClose} aria-label="Close day schedule"><X /></button>
        </header>
        <div className="day-drawer__heading">
          <p>{format(parseISO(date), "EEEE")}</p>
          <h2 id="day-drawer-title">{format(parseISO(date), "MMMM d")}</h2>
          <span>{events.length} {events.length === 1 ? "event" : "events"}</span>
        </div>
        <div className="day-event-list">
          {events.map((event) => {
            const Icon = ICONS[event.category];
            return (
              <button key={event.id} onClick={() => { onSelectEvent(event); onClose(); }} className={`day-event day-event--${event.category}`}>
                <span className="day-event__icon"><Icon /></span>
                <span className="day-event__copy">
                  <small>{event.category} {event.region ? `· ${event.region}` : ""}</small>
                  <strong>{event.name}</strong>
                  <span>{event.orgName}{event.game ? ` · ${event.game}` : ""}</span>
                </span>
                {event.orgLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="day-event__logo" src={event.orgLogoUrl} alt={`${event.orgName} logo`} loading="lazy" decoding="async" />
                ) : <span className="day-event__logo day-event__logo--fallback"><Icon /></span>}
                <ArrowUpRight className="day-event__arrow" />
              </button>
            );
          })}
        </div>
        <footer className="drawer-footer drawer-footer--quiet">
          <span>Select an event for complete details</span>
          {events.some((event) => event.streamLinks?.length) && <Tv />}
        </footer>
      </aside>
    </div>
  );
};
