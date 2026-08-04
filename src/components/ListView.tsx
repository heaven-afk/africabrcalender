"use client";

import React from "react";
import { format, parseISO, isAfter, isBefore, startOfToday } from "date-fns";
import { Tv, MessageSquare, Clock, Calendar, ChevronRight } from "lucide-react";
import { CalendarEvent } from "@/types/event";
import { CategoryPill } from "./CategoryPill";
import { OrgLogo } from "./OrgLogo";

interface ListViewProps {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
}

const daysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getStatus(evt: CalendarEvent): "live" | "upcoming" | "ended" {
  const today = startOfToday();
  const start = parseISO(evt.startDate);
  const end = parseISO(evt.endDate);
  if (isBefore(end, today)) return "ended";
  if (isAfter(start, today)) return "upcoming";
  return "live";
}

function formatDateRange(evt: CalendarEvent): string {
  try {
    const s = format(parseISO(evt.startDate), "MMM d");
    const e = format(parseISO(evt.endDate), "MMM d");
    return s === e ? s : `${s} – ${e}`;
  } catch {
    return `${evt.startDate} – ${evt.endDate}`;
  }
}

const catLeft = (category: string) => {
  if (category === "ranking") return "bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.6)]";
  if (category === "tournament") return "bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]";
  if (category === "award") return "bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.6)]";
  if (category === "podcast") return "bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.6)]";
  return "bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.6)]";
};

export const ListView: React.FC<ListViewProps> = ({ events, onSelectEvent }) => {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl liquid-glass border border-white/10">
        <Calendar className="w-10 h-10 text-zinc-600 mb-3" />
        <h3 className="font-display font-bold text-base text-zinc-400 tracking-wider">NO EVENTS SCHEDULED</h3>
        <p className="text-xs text-zinc-500 max-w-sm mt-1">
          No matching events found for this period. Try adjusting the filters or navigate to a different month.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((evt) => {
        const status = getStatus(evt);
        const isScrim = evt.category === "scrim";

        return (
          <div
            key={evt.id}
            onClick={() => onSelectEvent(evt)}
            className="relative rounded-2xl liquid-glass-card hover:border-amber-500/40 transition-all cursor-pointer group overflow-hidden"
          >
            {/* Category left stripe */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${catLeft(evt.category)}`} />

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4.5 pl-6">

              {/* Left: Logo + info */}
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <OrgLogo orgName={evt.orgName} logoUrl={evt.orgLogoUrl} size="md" />

                <div className="min-w-0">
                  {/* Badges row */}
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <CategoryPill category={evt.category} size="sm" />
                    {evt.stage && (
                      <span className="text-[10px] font-bold text-zinc-300 bg-white/[0.04] border border-white/10 px-2 py-0.5 rounded-md">
                        {evt.stage}
                      </span>
                    )}
                    {evt.region && (
                      <span className="text-[10px] font-bold text-zinc-400 bg-white/[0.04] border border-white/10 px-2 py-0.5 rounded-md">
                        {evt.region}
                      </span>
                    )}
                    {status === "live" && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                        <span className="dot-live" />
                        LIVE
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-display font-bold text-white text-base sm:text-lg leading-snug group-hover:text-amber-300 transition-colors truncate">
                    {evt.name}
                  </h3>

                  {/* Sub info */}
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Hosted by <strong className="text-zinc-200">{evt.orgName}</strong>
                    <span className="mx-2 text-zinc-600">·</span>
                    <span>{formatDateRange(evt)}</span>
                  </p>
                </div>
              </div>

              {/* Right: schedule + quick links */}
              <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0 sm:min-w-[140px]">
                {isScrim && evt.recurrence && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-semibold">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {evt.recurrence.daysOfWeek.map((d) => daysMap[d]).join(" ")} {evt.recurrence.startTime}–{evt.recurrence.endTime}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  {evt.streamLinks && evt.streamLinks.length > 0 && (
                    <a
                      href={evt.streamLinks[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-zinc-300 bg-white/[0.04] border border-white/10 hover:text-amber-400 hover:border-amber-500/30 transition-all"
                      title="Watch Stream"
                    >
                      <Tv className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">Stream</span>
                    </a>
                  )}

                  {evt.location?.discordUrl && (
                    <a
                      href={evt.location.discordUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-xl text-zinc-400 bg-white/[0.04] border border-white/10 hover:text-indigo-400 hover:border-indigo-500/30 transition-all"
                      title="Discord"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <div className="p-2 rounded-xl text-zinc-500 bg-white/[0.04] border border-white/10 group-hover:text-amber-400 group-hover:border-amber-500/30 transition-all">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
