"use client";

import React, { useRef, useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  format, getYear, eachMonthOfInterval, startOfYear, endOfYear,
  startOfMonth, endOfMonth, startOfWeek, addDays,
  eachDayOfInterval, isSameMonth, isToday,
} from "date-fns";
import { Medal, Trophy, Crosshair, Award, Mic2 } from "lucide-react";
import { CalendarEvent } from "@/types/event";
import { isScrimActiveOnDate } from "@/lib/utils";
import { isEventLive } from "@/lib/eventTiming";

interface GridViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  allEvents: CalendarEvent[];
  onDayClick: (date: string, events: CalendarEvent[]) => void;
  scrollToRef?: React.MutableRefObject<((dir: "prev" | "next" | "today") => void) | null>;
  now: Date;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CATEGORY_ICON = { ranking: Medal, tournament: Trophy, scrim: Crosshair, award: Award, podcast: Mic2 };

function getEventsForDay(date: string, events: CalendarEvent[]) {
  return events.filter((event) => {
    if (event.recurrence) return isScrimActiveOnDate(date, event.recurrence, event.startDate, event.endDate);
    return date >= event.startDate && date <= event.endDate;
  });
}

const EventMark = ({ event, now }: { event: CalendarEvent; now: Date }) => {
  const Icon = CATEGORY_ICON[event.category];
  const live = isEventLive(event, now);
  return (
    <span className={`cal-event-mark cal-event-mark--${event.category} ${live ? "is-live" : ""}`} title={`${event.name} — ${event.orgName}${live ? " — Live now" : ""}`}>
      {event.orgLogoUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.orgLogoUrl}
            alt=""
            loading="lazy"
            decoding="async"
            onError={(error) => {
              error.currentTarget.style.display = "none";
              const fallback = error.currentTarget.nextElementSibling as HTMLElement | null;
              if (fallback) fallback.style.display = "block";
            }}
          />
          <Icon className="cal-event-fallback" aria-hidden="true" />
        </>
      ) : <Icon aria-hidden="true" />}
    </span>
  );
};

interface DayCell {
  date: string;
  number: string;
  inMonth: boolean;
  today: boolean;
  dayEvents: CalendarEvent[];
}

interface MonthBlockProps {
  month: Date;
  events: CalendarEvent[];
  onDayClick: (date: string, events: CalendarEvent[]) => void;
  monthRef: (node: HTMLDivElement | null) => void;
  now: Date;
}

function HoverLogo({ event }: { event: CalendarEvent }) {
  const Icon = CATEGORY_ICON[event.category];
  return event.orgLogoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={event.orgLogoUrl} alt={`${event.orgName} logo`} loading="lazy" decoding="async" />
  ) : <span><Icon /></span>;
}

const MonthBlock = React.memo(function MonthBlock({
  month,
  events,
  onDayClick,
  monthRef,
  now,
}: MonthBlockProps) {
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    events: CalendarEvent[];
    left: number;
    top: number;
  } | null>(null);
  const days = useMemo<DayCell[]>(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = addDays(start, 41);
    return eachDayOfInterval({ start, end }).map((day: Date) => {
      const date = format(day, "yyyy-MM-dd");
      const inMonth = isSameMonth(day, month);
      const dayEvents = inMonth ? getEventsForDay(date, events) : [];
      return { date, number: format(day, "d"), inMonth, today: isToday(day), dayEvents };
    });
  }, [month, events]);

  const eventCount = useMemo(() => new Set(events.map((event) => event.id)).size, [events]);

  return (
    <div ref={monthRef} className="month-board scroll-mt-28">
      <header className="month-board__header">
        <div><h3>{format(month, "MMMM")}</h3><span>{format(month, "yyyy")}</span></div>
        <span className="month-board__count">{eventCount} {eventCount === 1 ? "event" : "events"}</span>
      </header>

      <div className="month-weekdays" aria-hidden="true">
        {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
      </div>

      <div className="month-days">
        {days.map(({ date, number, inMonth, today, dayEvents }: DayCell) => {
          const hasEvents = dayEvents.length > 0;
          return (
            <button
              key={date}
              type="button"
              disabled={!inMonth || !hasEvents}
              onClick={() => onDayClick(date, dayEvents)}
              onMouseEnter={(mouseEvent) => {
                if (!hasEvents || window.matchMedia("(hover: none)").matches) return;
                const rect = mouseEvent.currentTarget.getBoundingClientRect();
                const cardWidth = 286;
                const left = rect.right + cardWidth + 12 < window.innerWidth
                  ? rect.right + 8
                  : Math.max(8, rect.left - cardWidth - 8);
                setHoveredDay({
                  date,
                  events: dayEvents,
                  left,
                  top: Math.max(8, Math.min(rect.top, window.innerHeight - 230)),
                });
              }}
              onMouseLeave={() => setHoveredDay(null)}
              className={`cal-cell ${!inMonth ? "is-outside" : ""} ${today ? "is-today" : ""} ${hasEvents ? "has-events" : ""}`}
              aria-label={inMonth ? `${format(new Date(`${date}T12:00:00`), "MMMM d")}${hasEvents ? `, ${dayEvents.length} events` : ", no events"}` : undefined}
            >
              {inMonth && <span className="cal-day-num">{number}</span>}
              {hasEvents && (
                <span className="cal-event-stack">
                  {dayEvents.slice(0, 2).map((event: CalendarEvent) => <EventMark key={event.id} event={event} now={now} />)}
                  {dayEvents.length > 2 && <span className="cal-overflow">+{dayEvents.length - 2}</span>}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {hoveredDay && createPortal((
        <div className="calendar-hover-card" style={{ left: hoveredDay.left, top: hoveredDay.top }} role="status">
          <header>
            <div>
              <strong>{format(new Date(`${hoveredDay.date}T12:00:00`), "EEEE")}</strong>
              <span>{format(new Date(`${hoveredDay.date}T12:00:00`), "MMMM d")}</span>
            </div>
            <span>{hoveredDay.events.length}</span>
          </header>
          <div>
            {hoveredDay.events.slice(0, 4).map((event) => (
              <article key={event.id} className={`calendar-hover-event calendar-hover-event--${event.category}`}>
                <HoverLogo event={event} />
                <div><small>{event.category}{isEventLive(event, now) ? " · Live" : ""}</small><strong>{event.name}</strong><span>{event.orgName}{event.game ? ` · ${event.game}` : ""}</span></div>
              </article>
            ))}
            {hoveredDay.events.length > 4 && <p>+{hoveredDay.events.length - 4} more events</p>}
          </div>
        </div>
      ), document.body)}
    </div>
  );
});

export const GridView: React.FC<GridViewProps> = ({ currentDate, allEvents, onDayClick, scrollToRef, now }) => {
  const year = getYear(currentDate);
  const months = useMemo(() => eachMonthOfInterval({
    start: startOfYear(new Date(year, 0, 1)),
    end: endOfYear(new Date(year, 0, 1)),
  }), [year]);
  const monthRefs = useRef<(HTMLDivElement | null)[]>([]);

  const scrollToMonth = useCallback((direction: "prev" | "next" | "today") => {
    const behavior: ScrollBehavior = window.innerWidth < 768 ? "auto" : "smooth";
    if (direction === "today") {
      const index = new Date().getFullYear() === year ? new Date().getMonth() : currentDate.getMonth();
      monthRefs.current[index]?.scrollIntoView({ behavior, block: "start" });
      return;
    }
    let nearest = 0;
    let distance = Number.POSITIVE_INFINITY;
    monthRefs.current.forEach((node, index) => {
      if (!node) return;
      const nextDistance = Math.abs(node.getBoundingClientRect().top - 88);
      if (nextDistance < distance) { distance = nextDistance; nearest = index; }
    });
    const target = Math.max(0, Math.min(11, nearest + (direction === "next" ? 1 : -1)));
    monthRefs.current[target]?.scrollIntoView({ behavior, block: "start" });
  }, [currentDate, year]);

  useEffect(() => { if (scrollToRef) scrollToRef.current = scrollToMonth; }, [scrollToRef, scrollToMonth]);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => monthRefs.current[currentDate.getMonth()]?.scrollIntoView({ behavior: "smooth", block: "start" }));
    return () => window.cancelAnimationFrame(frame);
  }, [currentDate]);

  return (
    <section className="calendar-layout" aria-label={`${year} calendar`}>
      <nav className="month-jump" aria-label="Jump to month">
        {MONTHS_SHORT.map((label, index) => (
          <button
            key={label}
            onClick={() => monthRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className={index === currentDate.getMonth() ? "is-current" : ""}
          >{label}</button>
        ))}
      </nav>

      <div className="year-grid">
        {months.map((month: Date, index: number) => {
          const start = format(startOfMonth(month), "yyyy-MM-dd");
          const end = format(endOfMonth(month), "yyyy-MM-dd");
          const monthEvents = allEvents.filter((event) => event.startDate <= end && event.endDate >= start);
          return (
            <MonthBlock
              key={format(month, "yyyy-MM")}
              month={month}
              events={monthEvents}
              onDayClick={onDayClick}
              monthRef={(node) => { monthRefs.current[index] = node; }}
              now={now}
            />
          );
        })}
      </div>
    </section>
  );
};
