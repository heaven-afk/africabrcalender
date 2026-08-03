"use client";

import React, { useRef, useCallback, useEffect } from "react";
import {
  format, getYear, eachMonthOfInterval, startOfYear, endOfYear,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, isSameDay,
} from "date-fns";
import { CalendarEvent } from "@/types/event";
import { isScrimActiveOnDate, getOrgInitials } from "@/lib/utils";

interface GridViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  allEvents: CalendarEvent[];
  onDayClick: (date: string, events: CalendarEvent[]) => void;
  scrollToRef?: React.MutableRefObject<((dir: "prev" | "next") => void) | null>;
}

/** Predefined brand colors for categories when we can't sample the logo */
const CAT_COLOR: Record<string, string> = {
  ranking:    "180,100,30",   // amber-ish
  tournament: "20,130,180",   // cyan-ish
  scrim:      "20,160,100",   // emerald-ish
};

/** Blend two rgb strings "r,g,b" */
function blendRgb(a: string, b: string, t = 0.5): string {
  const [ar, ag, ab] = a.split(",").map(Number);
  const [br, bg, bb] = b.split(",").map(Number);
  return `${Math.round(ar + (br - ar) * t)},${Math.round(ag + (bg - ag) * t)},${Math.round(ab + (bb - ab) * t)}`;
}

/** Build CSS background for a day cell based on active events */
function buildCellBg(dayEvents: CalendarEvent[]): React.CSSProperties {
  if (dayEvents.length === 0) return { background: "#111113" };

  // Collect colors for each event
  const colors = dayEvents.map((e) => CAT_COLOR[e.category] || "100,100,100");

  if (dayEvents.length === 1) {
    const c = colors[0];
    return {
      background: `radial-gradient(circle at 60% 40%, rgba(${c},0.45) 0%, rgba(${c},0.05) 70%), #0e0e10`,
    };
  }

  // Multiple events: blend into gradient
  if (dayEvents.length === 2) {
    const c1 = colors[0], c2 = colors[1];
    return {
      background: `linear-gradient(135deg, rgba(${c1},0.45) 0%, rgba(${c2},0.45) 100%), #0e0e10`,
    };
  }

  // 3+ events
  const stops = colors
    .slice(0, 4)
    .map((c, i, arr) => `rgba(${c},0.4) ${Math.round((i / (arr.length - 1)) * 100)}%`)
    .join(", ");
  return {
    background: `linear-gradient(135deg, ${stops}), #0e0e10`,
  };
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTH_LETTERS = ["J","F","M","A","M","J","J","A","S","O","N","D"];

/** Get all events active on a given day string */
function getEventsForDay(dateStr: string, events: CalendarEvent[]): CalendarEvent[] {
  return events.filter((evt) => {
    if (evt.category === "scrim") {
      return evt.recurrence
        ? isScrimActiveOnDate(dateStr, evt.recurrence, evt.startDate, evt.endDate)
        : false;
    }
    return dateStr >= evt.startDate && dateStr <= evt.endDate;
  });
}

/** Single logo or initials circle inside a cell */
const EventLogo: React.FC<{ event: CalendarEvent }> = ({ event }) => {
  if (event.orgLogoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={event.orgLogoUrl}
        alt={event.orgName}
        className="cal-logo"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <div className="cal-logo-initials">
      {getOrgInitials(event.orgName)}
    </div>
  );
};

/** One month block */
const MonthBlock: React.FC<{
  month: Date;
  events: CalendarEvent[];
  onDayClick: (date: string, events: CalendarEvent[]) => void;
  monthRef: (el: HTMLDivElement | null) => void;
}> = ({ month, events, onDayClick, monthRef }) => {
  const mStart = startOfMonth(month);
  const mEnd = endOfMonth(month);
  const calStart = startOfWeek(mStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(mEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  return (
    <div ref={monthRef} className="w-full">
      {/* Month label */}
      <h3 className="font-display font-bold text-white text-base tracking-wide mb-2">
        {format(month, "MMMM")}
      </h3>

      {/* Weekday header */}
      <div className="grid grid-cols-7 mb-1 gap-px">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-[#52525b] py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-px">
        {days.map((day: Date, idx: number) => {
          const ds = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, month);
          const today = isToday(day);
          const dayEvents = inMonth ? getEventsForDay(ds, events) : [];
          const hasEvents = dayEvents.length > 0;
          const cellBg = buildCellBg(hasEvents ? dayEvents : []);
          const show = Math.min(dayEvents.length, 2);

          return (
            <div
              key={idx}
              onClick={() => hasEvents && inMonth && onDayClick(ds, dayEvents)}
              style={inMonth ? cellBg : { background: "transparent" }}
              className={`cal-cell ${!inMonth ? "empty" : ""} ${today ? "is-today" : ""} ${
                !inMonth ? "opacity-0 pointer-events-none" : ""
              } ${today ? "ring-1 ring-[#e8a33d]/60" : ""}`}
            >
              {inMonth && (
                <>
                  <span className="cal-day-num">{format(day, "d")}</span>

                  {/* Logos */}
                  {hasEvents && (
                    <div className={`flex items-center gap-1 ${show > 1 ? "scale-[0.78]" : ""}`}>
                      {dayEvents.slice(0, 2).map((evt) => (
                        <EventLogo key={evt.id} event={evt} />
                      ))}
                    </div>
                  )}

                  {/* Overflow badge */}
                  {dayEvents.length > 2 && (
                    <div className="cal-overflow">+{dayEvents.length - 2}</div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Full-year grid with all months stacked vertically (2 columns on desktop) */
export const GridView: React.FC<GridViewProps> = ({
  currentDate,
  events,
  allEvents,
  onDayClick,
  scrollToRef,
}) => {
  const year = getYear(currentDate);
  const months = eachMonthOfInterval({
    start: startOfYear(new Date(year, 0, 1)),
    end: endOfYear(new Date(year, 0, 1)),
  });

  // Refs to each month section for scrolling
  const monthRefs = useRef<(HTMLDivElement | null)[]>([]);

  const scrollToMonth = useCallback((dir: "prev" | "next") => {
    // Find the month currently most visible in the viewport
    let closest = 0;
    let closestDist = Infinity;
    monthRefs.current.forEach((el, i) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dist = Math.abs(rect.top - 80);
      if (dist < closestDist) { closestDist = dist; closest = i; }
    });
    const target = Math.max(0, Math.min(months.length - 1, closest + (dir === "next" ? 1 : -1)));
    monthRefs.current[target]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [months.length]);

  // Expose scroll function to parent via ref
  useEffect(() => {
    if (scrollToRef) scrollToRef.current = scrollToMonth;
  }, [scrollToRef, scrollToMonth]);

  return (
    <div className="flex gap-4">
      {/* Month letter sidebar */}
      <div className="hidden xl:flex flex-col w-6 pt-2 shrink-0 gap-1">
        {MONTH_LETTERS.map((m, i) => (
          <button
            key={i}
            onClick={() => monthRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className={`h-5 flex items-center justify-center text-[10px] font-bold leading-none transition-colors rounded ${
              i === currentDate.getMonth()
                ? "text-[#e8a33d]"
                : "text-[#3f3f46] hover:text-[#a1a1aa]"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* 2-column month grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
        {months.map((month: Date, i: number) => {
          const monthStr = format(month, "yyyy-MM");
          // Get events for this specific month
          const monthEvents = allEvents.filter((evt) => {
            if (evt.category === "scrim") {
              // Check if scrim overlaps this month
              const mStart = format(startOfMonth(month), "yyyy-MM-dd");
              const mEnd = format(endOfMonth(month), "yyyy-MM-dd");
              return evt.startDate <= mEnd && evt.endDate >= mStart;
            }
            return evt.startDate <= format(endOfMonth(month), "yyyy-MM-dd") &&
                   evt.endDate   >= format(startOfMonth(month), "yyyy-MM-dd");
          });

          return (
            <MonthBlock
              key={monthStr}
              month={month}
              events={monthEvents}
              onDayClick={onDayClick}
              monthRef={(el) => { monthRefs.current[i] = el; }}
            />
          );
        })}
      </div>
    </div>
  );
};
