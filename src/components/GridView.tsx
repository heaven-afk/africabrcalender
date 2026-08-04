"use client";

import React, { useRef, useCallback, useEffect, useMemo } from "react";
import {
  format, getYear, eachMonthOfInterval, startOfYear, endOfYear,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday,
} from "date-fns";
import { CalendarEvent } from "@/types/event";
import { isScrimActiveOnDate, getOrgInitials } from "@/lib/utils";

interface GridViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  allEvents: CalendarEvent[];
  onDayClick: (date: string, events: CalendarEvent[]) => void;
  scrollToRef?: React.MutableRefObject<((dir: "prev" | "next" | "today") => void) | null>;
}

const CAT_COLOR: Record<string, string> = {
  ranking:    "245,158,11",   // amber-500
  tournament: "6,182,212",    // cyan-500
  scrim:      "16,185,129",   // emerald-500
};

/** Build CSS background for a day cell based on up to 4 active event colors */
function buildCellBg(dayEvents: CalendarEvent[]): React.CSSProperties {
  if (dayEvents.length === 0) return { background: "rgba(18, 18, 24, 0.45)" };

  const colors = dayEvents.slice(0, 4).map((e) => CAT_COLOR[e.category] || "150,150,160");

  if (colors.length === 1) {
    const c = colors[0];
    return {
      background: `radial-gradient(circle at 60% 40%, rgba(${c},0.35) 0%, rgba(${c},0.05) 75%), rgba(18,18,24,0.65)`,
    };
  }

  if (colors.length === 2) {
    const [c1, c2] = colors;
    return {
      background: `linear-gradient(135deg, rgba(${c1},0.35) 0%, rgba(${c2},0.35) 100%), rgba(18,18,24,0.65)`,
    };
  }

  if (colors.length === 3) {
    const [c1, c2, c3] = colors;
    return {
      background: `linear-gradient(135deg, rgba(${c1},0.35) 0%, rgba(${c2},0.3) 50%, rgba(${c3},0.35) 100%), rgba(18,18,24,0.65)`,
    };
  }

  // 4 or more events: 4-quadrant blended radial background
  const [c1, c2, c3, c4] = colors;
  return {
    background: `radial-gradient(circle at 20% 20%, rgba(${c1},0.35) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(${c2},0.35) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(${c3},0.35) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(${c4},0.35) 0%, transparent 60%), rgba(18,18,24,0.65)`,
  };
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTH_LETTERS = ["J","F","M","A","M","J","J","A","S","O","N","D"];

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

interface DayCellData {
  idx: number;
  ds: string;
  dayNum: string;
  inMonth: boolean;
  today: boolean;
  dayEvents: CalendarEvent[];
  hasEvents: boolean;
  cellBg: React.CSSProperties;
  displayEvents: CalendarEvent[];
  overflowCount: number;
}

/** One month block with memoized date & day rendering */
const MonthBlock: React.FC<{
  month: Date;
  events: CalendarEvent[];
  onDayClick: (date: string, events: CalendarEvent[]) => void;
  monthRef: (el: HTMLDivElement | null) => void;
}> = React.memo(({ month, events, onDayClick, monthRef }) => {
  const mStart = startOfMonth(month);
  const mEnd = endOfMonth(month);
  const calStart = startOfWeek(mStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(mEnd, { weekStartsOn: 1 });
  const days = useMemo(() => eachDayOfInterval({ start: calStart, end: calEnd }), [calStart, calEnd]);

  // Pre-calculate days grid
  const daysGrid: DayCellData[] = useMemo(() => {
    return days.map((day: Date, idx: number) => {
      const ds = format(day, "yyyy-MM-dd");
      const inMonth = isSameMonth(day, month);
      const today = isToday(day);
      const dayEvents = inMonth ? getEventsForDay(ds, events) : [];
      const hasEvents = dayEvents.length > 0;
      const cellBg = buildCellBg(hasEvents ? dayEvents : []);
      const displayEvents = dayEvents.slice(0, 4);
      const overflowCount = dayEvents.length - 4;

      return {
        idx,
        ds,
        dayNum: format(day, "d"),
        inMonth,
        today,
        dayEvents,
        hasEvents,
        cellBg,
        displayEvents,
        overflowCount,
      };
    });
  }, [days, month, events]);

  return (
    <div ref={monthRef} className="w-full scroll-mt-20 p-3.5 sm:p-4 rounded-2xl liquid-glass-card">
      {/* Month label */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
        <h3 className="font-display font-bold text-white text-base sm:text-lg tracking-wide">
          {format(month, "MMMM")}
        </h3>
        <span className="text-[11px] font-mono font-medium text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
          {format(month, "yyyy")}
        </span>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 mb-2 gap-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold text-zinc-500 py-1 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {daysGrid.map(({ idx, ds, dayNum, inMonth, today, dayEvents, hasEvents, cellBg, displayEvents, overflowCount }) => {
          const logoCount = displayEvents.length;
          const containerClass =
            logoCount <= 2
              ? `flex items-center gap-0.5 sm:gap-1 logo-container-${logoCount}`
              : `grid grid-cols-2 gap-0.5 logo-container-${logoCount}`;

          return (
            <div
              key={idx}
              onClick={() => hasEvents && inMonth && onDayClick(ds, dayEvents)}
              style={inMonth ? cellBg : { background: "transparent" }}
              className={`cal-cell ${!inMonth ? "empty" : ""} ${today ? "is-today" : ""} ${
                !inMonth ? "opacity-0 pointer-events-none" : ""
              } ${today ? "ring-2 ring-amber-400/80 shadow-[0_0_16px_rgba(245,158,11,0.4)]" : ""}`}
            >
              {inMonth && (
                <>
                  <span className="cal-day-num">{dayNum}</span>

                  {/* Logos — up to 4 */}
                  {hasEvents && (
                    <div className={containerClass}>
                      {displayEvents.map((evt) => (
                        <EventLogo key={evt.id} event={evt} />
                      ))}
                    </div>
                  )}

                  {/* Overflow badge if > 4 */}
                  {overflowCount > 0 && (
                    <div className="cal-overflow">+{overflowCount}</div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

MonthBlock.displayName = "MonthBlock";

/** Full-year grid with all months stacked vertically (2 columns on desktop) */
export const GridView: React.FC<GridViewProps> = ({
  currentDate,
  allEvents,
  onDayClick,
  scrollToRef,
}) => {
  const year = getYear(currentDate);

  const months = useMemo(() => {
    return eachMonthOfInterval({
      start: startOfYear(new Date(year, 0, 1)),
      end: endOfYear(new Date(year, 0, 1)),
    });
  }, [year]);

  const monthRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Instant scroll on mobile to remove navigation lag, smooth on desktop
  const scrollToMonth = useCallback((dir: "prev" | "next" | "today") => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const scrollBehavior: ScrollBehavior = isMobile ? "auto" : "smooth";

    if (dir === "today") {
      const todayEl = document.querySelector(".cal-cell.is-today");
      if (todayEl) {
        todayEl.scrollIntoView({ behavior: scrollBehavior, block: "center" });
      } else {
        const todayIndex = new Date().getMonth();
        monthRefs.current[todayIndex]?.scrollIntoView({ behavior: scrollBehavior, block: "start" });
      }
      return;
    }

    let closest = 0;
    let closestDist = Infinity;
    monthRefs.current.forEach((el, i) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dist = Math.abs(rect.top - 80);
      if (dist < closestDist) { closestDist = dist; closest = i; }
    });
    const target = Math.max(0, Math.min(months.length - 1, closest + (dir === "next" ? 1 : -1)));
    monthRefs.current[target]?.scrollIntoView({ behavior: scrollBehavior, block: "start" });
  }, [months.length]);

  useEffect(() => {
    if (scrollToRef) scrollToRef.current = scrollToMonth;
  }, [scrollToRef, scrollToMonth]);

  return (
    <div className="flex gap-4">
      {/* Month letter sidebar */}
      <div className="hidden xl:flex flex-col w-7 pt-2 shrink-0 gap-1 liquid-glass p-1 rounded-xl h-fit sticky top-20">
        {MONTH_LETTERS.map((m, i) => (
          <button
            key={i}
            onClick={() => monthRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className={`h-6 flex items-center justify-center text-[10px] font-bold leading-none transition-all rounded-lg ${
              i === currentDate.getMonth()
                ? "text-amber-400 bg-amber-500/10 border border-amber-500/30"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* 2-column month grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {months.map((month: Date, i: number) => {
          const monthStr = format(month, "yyyy-MM");
          const monthEvents = allEvents.filter((evt) => {
            if (evt.category === "scrim") {
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
