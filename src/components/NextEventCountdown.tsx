"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Clock, Radio, ChevronRight, Zap } from "lucide-react";
import { CalendarEvent } from "@/types/event";
import { OrgLogo } from "./OrgLogo";
import { CategoryPill } from "./CategoryPill";
import { parseISO, addDays, setHours, setMinutes } from "date-fns";

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
        const eventEnd = addDays(eventStart, 0);

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

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const nextTarget = useMemo<NextEventTarget | null>(() => {
    if (!events || events.length === 0) return null;

    let closest: NextEventTarget | null = null;

    for (const evt of events) {
      const target = getNextTarget(evt, now);
      if (!target) continue;

      if (target.isLive) {
        return target;
      }

      if (!closest || target.targetDate < closest.targetDate) {
        closest = target;
      }
    }

    return closest;
  }, [events, now]);

  if (!nextTarget) return null;

  const { event, targetDate, isLive } = nextTarget;

  const diffMs = Math.max(0, targetDate.getTime() - now.getTime());
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  const seconds = Math.floor((diffMs / 1000) % 60);

  return (
    <div
      onClick={() => onSelectEvent(event)}
      className="mb-5 group relative rounded-2xl liquid-glass-card p-3.5 sm:p-4 cursor-pointer overflow-hidden border border-white/[0.07]"
    >
      {/* Soft background ambient glow */}
      <div
        className="absolute -right-12 -bottom-12 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-20 transition-opacity group-hover:opacity-35"
        style={{
          background: isLive ? "#10b981" : "#f59e0b",
        }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Event info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <OrgLogo orgName={event.orgName} logoUrl={event.orgLogoUrl} size="md" />
            {isLive && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              {isLive ? (
                <span className="inline-flex items-center gap-1 text-[9.5px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-md">
                  <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                  Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[9.5px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-md">
                  <Zap className="w-2.5 h-2.5 text-amber-400" />
                  Next Up
                </span>
              )}

              <CategoryPill category={event.category} size="sm" />
            </div>

            <h4 className="font-display font-bold text-white text-sm sm:text-base tracking-wide group-hover:text-amber-300 transition-colors truncate">
              {event.name}
            </h4>
            <p className="text-[10.5px] text-zinc-400 truncate">
              {event.orgName} {event.stage ? `· ${event.stage}` : ""}
            </p>
          </div>
        </div>

        {/* Right: Live Countdown Display */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06] shrink-0">
          {isLive ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span>In Progress</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400/80 shrink-0 mr-0.5" />

              {days > 0 && (
                <div className="flex flex-col items-center justify-center liquid-glass-gold px-2 py-0.5 rounded-lg min-w-[34px]">
                  <span className="font-mono text-xs sm:text-sm font-bold text-amber-300 leading-none">{days}</span>
                  <span className="text-[7.5px] text-amber-400/80 uppercase font-bold tracking-wider mt-0.5">d</span>
                </div>
              )}

              <div className="flex flex-col items-center justify-center liquid-glass-gold px-2 py-0.5 rounded-lg min-w-[34px]">
                <span className="font-mono text-xs sm:text-sm font-bold text-amber-300 leading-none">
                  {String(hours).padStart(2, "0")}
                </span>
                <span className="text-[7.5px] text-amber-400/80 uppercase font-bold tracking-wider mt-0.5">h</span>
              </div>

              <span className="text-amber-500/50 font-bold text-[10px]">:</span>

              <div className="flex flex-col items-center justify-center liquid-glass-gold px-2 py-0.5 rounded-lg min-w-[34px]">
                <span className="font-mono text-xs sm:text-sm font-bold text-amber-300 leading-none">
                  {String(minutes).padStart(2, "0")}
                </span>
                <span className="text-[7.5px] text-amber-400/80 uppercase font-bold tracking-wider mt-0.5">m</span>
              </div>

              <span className="text-amber-500/50 font-bold text-[10px]">:</span>

              <div className="flex flex-col items-center justify-center liquid-glass-gold px-2 py-0.5 rounded-lg min-w-[34px]">
                <span className="font-mono text-xs sm:text-sm font-bold text-amber-400 leading-none">
                  {String(seconds).padStart(2, "0")}
                </span>
                <span className="text-[7.5px] text-amber-400 uppercase font-bold tracking-wider mt-0.5">s</span>
              </div>
            </div>
          )}

          <div className="p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-zinc-400 group-hover:text-amber-400 transition-all">
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
