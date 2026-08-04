"use client";

import React from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  isSameMonth,
  parseISO,
} from "date-fns";
import { CalendarEvent } from "@/types/event";
import { isScrimActiveOnDate } from "@/lib/utils";
import { OrgLogo } from "./OrgLogo";
import { CategoryPill } from "./CategoryPill";

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onSelectEvent: (e: CalendarEvent) => void;
}

const catBg = (category: string) => {
  if (category === "ranking") return "bg-amber-950/40 border-amber-500/30 hover:border-amber-400/60";
  if (category === "tournament") return "bg-cyan-950/40 border-cyan-500/30 hover:border-cyan-400/60";
  if (category === "award") return "bg-purple-950/40 border-purple-500/30 hover:border-purple-400/60";
  if (category === "podcast") return "bg-rose-950/40 border-rose-500/30 hover:border-rose-400/60";
  return "bg-emerald-950/40 border-emerald-500/30 hover:border-emerald-400/60";
};

export const WeekView: React.FC<WeekViewProps> = ({ currentDate, events, onSelectEvent }) => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getEventsForDay = (day: Date) => {
    const ds = format(day, "yyyy-MM-dd");
    return events.filter((evt) => {
      if (evt.category === "scrim") {
        return evt.recurrence && isScrimActiveOnDate(ds, evt.recurrence, evt.startDate, evt.endDate);
      }
      return ds >= evt.startDate && ds <= evt.endDate;
    });
  };

  const totalEventsThisWeek = days.reduce((acc: number, d: Date) => acc + getEventsForDay(d).length, 0);

  return (
    <div className="space-y-4">
      {/* Week header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display font-bold text-white tracking-wider text-lg">
          {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
        </h2>
        <span className="text-xs text-neutral-500">
          {totalEventsThisWeek} event{totalEventsThisWeek !== 1 ? "s" : ""} this week
        </span>
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
        {days.map((day: Date) => {
          const dayEvents = getEventsForDay(day);
          const today = isToday(day);
          const currentMonthDay = isSameMonth(day, currentDate);

          return (
            <div
              key={day.toISOString()}
              className={`rounded-xl border p-2.5 sm:p-3 min-h-[100px] sm:min-h-[160px] transition-all ${
                today
                  ? "border-gold-500/50 bg-gold-500/5"
                  : currentMonthDay
                  ? "border-surface-border bg-surface/50"
                  : "border-surface-border/40 bg-surface/20 opacity-60"
              }`}
            >
              {/* Day header */}
              <div className="mb-2.5 flex sm:flex-col items-center sm:items-start gap-2 sm:gap-0">
                <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-500">
                  {format(day, "EEE")}
                </span>
                <span
                  className={`text-xl font-display font-bold leading-none ${
                    today ? "text-gold-400" : currentMonthDay ? "text-white" : "text-neutral-600"
                  }`}
                >
                  {format(day, "d")}
                </span>
              </div>

              {/* Events */}
              <div className="space-y-1.5">
                {dayEvents.length === 0 && (
                  <div className="text-[10px] text-neutral-700 italic">No events</div>
                )}
                {dayEvents.map((evt) => (
                  <button
                    key={evt.id}
                    onClick={() => onSelectEvent(evt)}
                    className={`w-full text-left p-2 rounded-lg border text-[11px] font-medium transition-all hover:scale-[1.02] ${catBg(evt.category)}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <OrgLogo orgName={evt.orgName} logoUrl={evt.orgLogoUrl} size="sm" />
                      <span className="font-semibold text-white truncate flex-1">{evt.name}</span>
                    </div>
                    {evt.stage && (
                      <div className="text-[10px] text-neutral-500 truncate">{evt.stage}</div>
                    )}
                    {evt.category === "scrim" && evt.recurrence && (
                      <div className="text-[10px] text-emerald-400 mt-0.5">
                        {evt.recurrence.startTime}–{evt.recurrence.endTime}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
