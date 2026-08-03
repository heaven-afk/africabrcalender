"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Clock, Radio, Calendar, ChevronRight, Zap } from "lucide-react";
import { CalendarEvent } from "@/types/event";
import { OrgLogo } from "./OrgLogo";
import { CategoryPill } from "./CategoryPill";
import { parseISO, isAfter, isBefore, addDays, setHours, setMinutes } from "date-fns";

interface NextEventCountdownProps {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
}

interface NextEventTarget {
  event: CalendarEvent;
  targetDate: Date;
  isLive: boolean;
}

/** Compute the next target date for an event relative to now */
function getNextTarget(event: CalendarEvent, now: Date): NextEventTarget | null {
  try {
    const todayStr = now.toISOString().split("T")[0];

    // Check non-scrim event
    if (event.category !== "scrim" || !event.recurrence) {
      const startDate = parseISO(event.startDate);
      const endDate = parseISO(event.endDate);

      // If currently running today
      if (now >= startDate && now <= endDate) {
        return { event, targetDate: startDate, isLive: true };
      }

      // If in the future
      if (startDate > now) {
        return { event, targetDate: startDate, isLive: false };
      }

      return null;
    }

    // Scrim event with recurrence
    const { startTime, daysOfWeek, exceptions } = event.recurrence;
    const [h, m] = (startTime || "18:00").split(":").map(Number);

    const scrimStart = parseISO(event.startDate);
    const scrimEnd = parseISO(event.endDate);

    if (now > scrimEnd) return null;

    // Check today first
    let checkDate = now < scrimStart ? new Date(scrimStart) : new Date(now);

    // Look ahead up to 14 days for next active scrim day
    for (let i = 0; i < 14; i++) {
      const d = addDays(checkDate, i);
      const dateStr = d.toISOString().split("T")[0];

      if (dateStr > event.endDate) break;
      if (exceptions && exceptions.includes(dateStr)) continue;

      const dayOfWeek = d.getDay();
      if (daysOfWeek.includes(dayOfWeek)) {
        const eventStart = setMinutes(setHours(d, h), m);
        const eventEnd = addDays(eventStart, 0); // approx end

        if (now >= eventStart && now <= eventEnd) {
          return { event, targetDate: eventStart, isLive: true };
        }

        if (eventStart > now) {
          return { event, targetDate: eventStart, isLive: false };
        }
      }
    }
  } catch (err) {
    console.error("Error computing next event target:", err);
  }
  return null;
}

export const NextEventCountdown: React.FC<NextEventCountdownProps> = ({ events, onSelectEvent }) => {
  const [now, setNow] = useState<Date>(new Date());

  // Tick clock every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Find closest upcoming or live event
  const nextTarget = useMemo<NextEventTarget | null>(() => {
    if (!events || events.length === 0) return null;

    let closest: NextEventTarget | null = null;

    for (const evt of events) {
      const target = getNextTarget(evt, now);
      if (!target) continue;

      if (target.isLive) {
        return target; // Live events take priority
      }

      if (!closest || target.targetDate < closest.targetDate) {
        closest = target;
      }
    }

    return closest;
  }, [events, now]);

  if (!nextTarget) return null;

  const { event, targetDate, isLive } = nextTarget;

  // Calculate remaining time
  const diffMs = Math.max(0, targetDate.getTime() - now.getTime());
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  const seconds = Math.floor((diffMs / 1000) % 60);

  return (
    <div
      onClick={() => onSelectEvent(event)}
      className="mb-6 group relative rounded-xl border border-surface-border bg-gradient-to-r from-[#141419] via-[#1a1922] to-[#141419] p-3.5 sm:p-4 hover:border-gold-500/40 transition-all cursor-pointer overflow-hidden shadow-lg"
    >
      {/* Background glow accent */}
      <div
        className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-20 transition-opacity group-hover:opacity-30"
        style={{
          background: isLive ? "#22c55e" : "#e8a33d",
        }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Event info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <OrgLogo orgName={event.orgName} logoUrl={event.orgLogoUrl} size="md" />
            {isLive && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {isLive ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-md">
                  <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                  Live Now
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-gold bg-gold/10 border border-gold/30 px-2 py-0.5 rounded-md">
                  <Zap className="w-3 h-3 text-gold" />
                  Next Event
                </span>
              )}

              <CategoryPill category={event.category} size="sm" />

              {event.stage && (
                <span className="text-[10px] text-neutral-400 bg-surface-elevated px-2 py-0.5 rounded border border-surface-border truncate">
                  {event.stage}
                </span>
              )}
            </div>

            <h4 className="font-display font-bold text-white text-sm sm:text-base tracking-wide group-hover:text-gold transition-colors truncate">
              {event.name}
            </h4>
            <p className="text-[11px] text-neutral-500 truncate">
              Hosted by <span className="text-neutral-400">{event.orgName}</span>
            </p>
          </div>
        </div>

        {/* Right: Live Countdown Display */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-border/50 shrink-0">
          {isLive ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
              <Radio className="w-4 h-4 animate-pulse text-emerald-400" />
              <span className="text-xs font-bold tracking-wider uppercase">Event In Progress</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Clock className="w-4 h-4 text-gold shrink-0 mr-1" />

              {days > 0 && (
                <div className="flex flex-col items-center justify-center bg-[#0a0a0c] border border-surface-border px-2 py-1 rounded-lg min-w-[36px]">
                  <span className="font-mono text-sm sm:text-base font-bold text-white leading-none">{days}</span>
                  <span className="text-[9px] text-neutral-500 uppercase font-semibold">days</span>
                </div>
              )}

              <div className="flex flex-col items-center justify-center bg-[#0a0a0c] border border-surface-border px-2 py-1 rounded-lg min-w-[36px]">
                <span className="font-mono text-sm sm:text-base font-bold text-white leading-none">
                  {String(hours).padStart(2, "0")}
                </span>
                <span className="text-[9px] text-neutral-500 uppercase font-semibold">hrs</span>
              </div>

              <span className="text-neutral-600 font-bold text-xs">:</span>

              <div className="flex flex-col items-center justify-center bg-[#0a0a0c] border border-surface-border px-2 py-1 rounded-lg min-w-[36px]">
                <span className="font-mono text-sm sm:text-base font-bold text-white leading-none">
                  {String(minutes).padStart(2, "0")}
                </span>
                <span className="text-[9px] text-neutral-500 uppercase font-semibold">min</span>
              </div>

              <span className="text-neutral-600 font-bold text-xs">:</span>

              <div className="flex flex-col items-center justify-center bg-[#0a0a0c] border border-surface-border px-2 py-1 rounded-lg min-w-[36px]">
                <span className="font-mono text-sm sm:text-base font-bold text-gold leading-none">
                  {String(seconds).padStart(2, "0")}
                </span>
                <span className="text-[9px] text-gold/70 uppercase font-semibold">sec</span>
              </div>
            </div>
          )}

          <div className="p-1.5 rounded-lg text-neutral-600 group-hover:text-gold transition-colors">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
