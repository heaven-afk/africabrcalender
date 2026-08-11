"use client";

import React from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from "date-fns";
import { CalendarDays, ChevronRight, Clock3, Trophy, Medal, Crosshair, Award, Mic2 } from "lucide-react";
import { CalendarEvent, EventCategory } from "@/types/event";
import { isScrimActiveOnDate } from "@/lib/utils";
import { OrgLogo } from "./OrgLogo";

interface WeekViewProps { currentDate: Date; events: CalendarEvent[]; onSelectEvent: (e: CalendarEvent) => void; }

const icons: Record<EventCategory, React.ElementType> = { ranking: Medal, tournament: Trophy, scrim: Crosshair, award: Award, podcast: Mic2 };

export const WeekView: React.FC<WeekViewProps> = ({ currentDate, events, onSelectEvent }) => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const getEventsForDay = (day: Date) => {
    const ds = format(day, "yyyy-MM-dd");
    return events.filter((evt) => evt.recurrence
      ? isScrimActiveOnDate(ds, evt.recurrence, evt.startDate, evt.endDate)
      : ds >= evt.startDate && ds <= evt.endDate);
  };
  const total = days.reduce((sum: number, day: Date) => sum + getEventsForDay(day).length, 0);

  return (
    <section className="week-view" aria-label="Weekly schedule">
      <header className="view-heading">
        <div><h2>{format(weekStart, "MMM d")} <b>—</b> {format(weekEnd, "MMM d")}</h2></div>
        <p><strong>{total}</strong> event appearance{total === 1 ? "" : "s"}</p>
      </header>

      <div className="week-board-new">
        {days.map((day: Date) => {
          const dayEvents = getEventsForDay(day);
          const today = isToday(day);
          return (
            <section key={day.toISOString()} className={`week-column ${today ? "is-today" : ""}`}>
              <header className="week-column__head">
                <div><span>{format(day, "EEE")}</span><strong>{format(day, "d")}</strong></div>
                {today && <em>Today</em>}
                <small>{dayEvents.length || "—"}</small>
              </header>
              <div className="week-column__events">
                {dayEvents.length === 0 ? <div className="week-empty"><CalendarDays /><span>Clear</span></div> : dayEvents.map((evt) => {
                  const Icon = icons[evt.category];
                  return (
                    <button key={evt.id} className={`week-card week-card--${evt.category}`} onClick={() => onSelectEvent(evt)}>
                      <div className="week-card__top"><span><Icon />{evt.category}</span><ChevronRight /></div>
                      <div className="week-card__identity"><OrgLogo orgName={evt.orgName} logoUrl={evt.orgLogoUrl} size="sm" /><div><strong>{evt.name}</strong><small>{evt.orgName}</small></div></div>
                      <div className="week-card__meta">{(evt.startTime || evt.recurrence?.startTime) ? <><Clock3 />{evt.startTime || evt.recurrence?.startTime}{(evt.endTime || evt.recurrence?.endTime) ? `–${evt.endTime || evt.recurrence?.endTime}` : ""}</> : evt.stage || evt.game || "View details"}</div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
};
