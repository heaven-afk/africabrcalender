"use client";

import React from "react";
import { format, parseISO } from "date-fns";
import { Trophy, Tv, ExternalLink, ChevronDown, ChevronRight, Gamepad2, Award, Sparkles, Mic } from "lucide-react";
import { CalendarEvent } from "@/types/event";
import { OrgLogo } from "./OrgLogo";
import { CategoryPill } from "./CategoryPill";

interface TournamentsViewProps {
  events: CalendarEvent[];
  onSelectEvent: (e: CalendarEvent) => void;
}

export const TournamentsView: React.FC<TournamentsViewProps> = ({ events, onSelectEvent }) => {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  const grouped = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((evt) => {
      const key = evt.name;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(evt);
    });
    return Array.from(map.entries())
      .map(([name, evts]) => ({ name, events: evts }))
      .sort((a, b) => {
        const aDate = a.events[0]?.startDate || "";
        const bDate = b.events[0]?.startDate || "";
        return aDate.localeCompare(bDate);
      });
  }, [events]);

  const toggleGroup = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const catIcon = (category: string) => {
    if (category === "tournament") return <Trophy className="w-4 h-4 text-cyan-400" />;
    if (category === "ranking") return <Award className="w-4 h-4 text-amber-400" />;
    if (category === "award") return <Sparkles className="w-4 h-4 text-purple-400" />;
    if (category === "podcast") return <Mic className="w-4 h-4 text-rose-400" />;
    return <Gamepad2 className="w-4 h-4 text-emerald-400" />;
  };

  const formatRange = (evt: CalendarEvent) => {
    try {
      const s = format(parseISO(evt.startDate), "MMM d");
      const e = format(parseISO(evt.endDate), "MMM d");
      return s === e ? s : `${s} – ${e}`;
    } catch {
      return `${evt.startDate} – ${evt.endDate}`;
    }
  };

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl liquid-glass border border-white/10">
        <Trophy className="w-12 h-12 text-zinc-600 mb-3" />
        <h3 className="font-display font-bold text-lg text-zinc-400 tracking-wider">NO TOURNAMENTS FOUND</h3>
        <p className="text-xs text-zinc-500 mt-1">No events match the currently selected filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {grouped.map(({ name, events: groupEvents }) => {
        const representative = groupEvents[0];
        const isOpen = expanded.has(name);
        const multiStage = groupEvents.length > 1;

        return (
          <div
            key={name}
            className="liquid-glass-card rounded-2xl overflow-hidden transition-all duration-300"
          >
            {/* Group header row */}
            <div
              className="flex items-center gap-4 p-4.5 cursor-pointer group"
              onClick={() => toggleGroup(name)}
            >
              {/* Org logo */}
              <OrgLogo orgName={representative.orgName} logoUrl={representative.orgLogoUrl} size="md" />

              {/* Title & meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <CategoryPill category={representative.category} size="sm" />
                  {representative.region && (
                    <span className="text-[10px] uppercase font-bold text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/10">
                      {representative.region}
                    </span>
                  )}
                </div>
                <h3 className="font-display font-bold text-white text-base sm:text-lg group-hover:text-amber-300 transition-colors truncate">
                  {name}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Hosted by <strong className="text-zinc-200">{representative.orgName}</strong> · {formatRange(representative)}
                  {multiStage && ` · ${groupEvents.length} stages`}
                </p>
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-2.5 shrink-0">
                {representative.streamLinks?.length > 0 && (
                  <a
                    href={representative.streamLinks[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 rounded-xl text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all border border-transparent hover:border-amber-500/30"
                    title="Watch Stream"
                  >
                    <Tv className="w-4 h-4" />
                  </a>
                )}
                {catIcon(representative.category)}
                {multiStage && (
                  <span className="p-1 rounded-lg text-zinc-500 transition-transform duration-200" style={{ transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)" }}>
                    <ChevronDown className="w-4 h-4" />
                  </span>
                )}
                {!multiStage && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelectEvent(representative); }}
                    className="p-2 rounded-xl text-zinc-500 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Expanded stage rows */}
            {isOpen && multiStage && (
              <div className="border-t border-white/10 divide-y divide-white/5 bg-black/20">
                {groupEvents.map((evt) => (
                  <button
                    key={evt.id}
                    onClick={() => onSelectEvent(evt)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-white/[0.04] transition-colors group/stage"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-zinc-200 group-hover/stage:text-amber-300 transition-colors truncate">
                        {evt.stage || evt.name}
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        {formatRange(evt)}
                      </div>
                    </div>
                    {evt.streamLinks?.length > 0 && (
                      <a
                        href={evt.streamLinks[0].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-zinc-500 hover:text-amber-400 transition-colors"
                      >
                        <Tv className="w-4 h-4" />
                      </a>
                    )}
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-600 group-hover/stage:text-white transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
