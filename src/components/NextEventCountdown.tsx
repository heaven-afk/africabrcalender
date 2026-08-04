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
      className="mb-6 group relative rounded-2xl liquid-glass-card p-4 sm:p-5 cursor-pointer overflow-hidden"
    >
      {/* Soft background ambient glow */}
      <div
        className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-25 transition-opacity group-hover:opacity-40"
        style={{
          background: isLive ? "#10b981" : "#f59e0b",
        }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Event info */}
        <div className="flex items-center gap-3.5 min-w-0">
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
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-md shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                  <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                  Live Now
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-md shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Next Up
                </span>
              )}

              <CategoryPill category={event.category} size="sm" />

              {event.stage && (
                <span className="text-[10px] text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/10 truncate">
                  {event.stage}
                </span>
              )}
            </div>

            <h4 className="font-display font-bold text-white text-base sm:text-lg tracking-wide group-hover:text-amber-300 transition-colors truncate">
              {event.name}
            </h4>
            <p className="text-[11px] text-zinc-400 truncate">
              Hosted by <span className="text-zinc-200 font-medium">{event.orgName}</span>
            </p>
          </div>
        </div>

        {/* Right: Live Countdown Display */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/10 shrink-0">
          {isLive ? (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Radio className="w-4 h-4 animate-pulse text-emerald-400" />
              <span className="text-xs font-bold tracking-wider uppercase">Match In Progress</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mr-1" />

              {days > 0 && (
                <div className="flex flex-col items-center justify-center liquid-glass-gold px-2.5 py-1 rounded-xl min-w-[40px]">
                  <span className="font-mono text-sm sm:text-base font-bold text-amber-300 leading-none">{days}</span>
                  <span className="text-[8px] text-amber-400/80 uppercase font-bold tracking-wider mt-0.5">days</span>
                </div>
              )}

              <div className="flex flex-col items-center justify-center liquid-glass-gold px-2.5 py-1 rounded-xl min-w-[40px]">
                <span className="font-mono text-sm sm:text-base font-bold text-amber-300 leading-none">
                  {String(hours).padStart(2, "0")}
                </span>
                <span className="text-[8px] text-amber-400/80 uppercase font-bold tracking-wider mt-0.5">hrs</span>
              </div>

              <span className="text-amber-500/60 font-bold text-xs">:</span>

              <div className="flex flex-col items-center justify-center liquid-glass-gold px-2.5 py-1 rounded-xl min-w-[40px]">
                <span className="font-mono text-sm sm:text-base font-bold text-amber-300 leading-none">
                  {String(minutes).padStart(2, "0")}
                </span>
                <span className="text-[8px] text-amber-400/80 uppercase font-bold tracking-wider mt-0.5">min</span>
              </div>

              <span className="text-amber-500/60 font-bold text-xs">:</span>

              <div className="flex flex-col items-center justify-center liquid-glass-gold px-2.5 py-1 rounded-xl min-w-[40px]">
                <span className="font-mono text-sm sm:text-base font-bold text-amber-400 leading-none">
                  {String(seconds).padStart(2, "0")}
                </span>
                <span className="text-[8px] text-amber-400 uppercase font-bold tracking-wider mt-0.5">sec</span>
              </div>
            </div>
          )}

          <div className="p-2 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-400 group-hover:text-amber-400 group-hover:border-amber-500/40 transition-all">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
