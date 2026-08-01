"use client";

import React from "react";
import { format, parseISO } from "date-fns";
import { Trophy, Tv, ExternalLink, ChevronDown, ChevronRight, Gamepad2, Award } from "lucide-react";
import { CalendarEvent } from "@/types/event";
import { OrgLogo } from "./OrgLogo";
import { CategoryPill } from "./CategoryPill";

interface TournamentsViewProps {
  events: CalendarEvent[];
  onSelectEvent: (e: CalendarEvent) => void;
}

export const TournamentsView: React.FC<TournamentsViewProps> = ({ events, onSelectEvent }) => {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  // Group events by tournament name (orgName + name)
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
    if (category === "tournament") return <Trophy className="w-3.5 h-3.5 text-gold-400" />;
    if (category === "ranking") return <Award className="w-3.5 h-3.5 text-amber-400" />;
    return <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />;
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
      <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl bg-surface/30 border border-surface-border">
        <Trophy className="w-12 h-12 text-neutral-700 mb-3" />
        <h3 className="font-display font-bold text-lg text-neutral-400 tracking-wider">NO TOURNAMENTS</h3>
        <p className="text-xs text-neutral-600 mt-1">No events found for the current filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {grouped.map(({ name, events: groupEvents }) => {
        const representative = groupEvents[0];
        const isOpen = expanded.has(name);
        const multiStage = groupEvents.length > 1;

        return (
          <div
            key={name}
            className="esports-chip-card rounded-xl overflow-hidden"
          >
            {/* Group header row */}
            <div
              className="flex items-center gap-4 p-4 cursor-pointer group"
              onClick={() => toggleGroup(name)}
            >
              {/* Org logo */}
              <OrgLogo orgName={representative.orgName} logoUrl={representative.orgLogoUrl} size="md" />

              {/* Title & meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <CategoryPill category={representative.category} size="sm" />
                  {representative.region && (
                    <span className="text-[10px] uppercase font-bold text-neutral-500 bg-surface-elevated px-2 py-0.5 rounded border border-surface-border">
                      {representative.region}
                    </span>
                  )}
                </div>
                <h3 className="font-display font-bold text-white text-base sm:text-lg group-hover:text-gold-300 transition-colors truncate">
                  {name}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {representative.orgName} · {formatRange(representative)}
                  {multiStage && ` · ${groupEvents.length} stages`}
                </p>
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-2 shrink-0">
                {representative.streamLinks?.length > 0 && (
                  <a
                    href={representative.streamLinks[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg text-neutral-600 hover:text-gold-400 hover:bg-gold-500/10 transition-all"
                    title="Watch stream"
                  >
                    <Tv className="w-4 h-4" />
                  </a>
                )}
                {catIcon(representative.category)}
                {multiStage && (
                  <span className="text-neutral-600 transition-transform duration-200" style={{ transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)" }}>
                    <ChevronDown className="w-4 h-4" />
                  </span>
                )}
                {!multiStage && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelectEvent(representative); }}
                    className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-300 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Expanded stage rows */}
            {isOpen && multiStage && (
              <div className="border-t border-surface-border divide-y divide-surface-border">
                {groupEvents.map((evt) => (
                  <button
                    key={evt.id}
                    onClick={() => onSelectEvent(evt)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/4 transition-colors group/stage"
                  >
                    <ChevronRight className="w-3 h-3 text-neutral-700 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-neutral-300 group-hover/stage:text-white transition-colors truncate">
                        {evt.stage || evt.name}
                      </div>
                      <div className="text-[11px] text-neutral-600 mt-0.5">
                        {formatRange(evt)}
                      </div>
                    </div>
                    {evt.streamLinks?.length > 0 && (
                      <a
                        href={evt.streamLinks[0].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-neutral-600 hover:text-gold-400 transition-colors"
                      >
                        <Tv className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <ExternalLink className="w-3.5 h-3.5 text-neutral-700 group-hover/stage:text-neutral-400 transition-colors" />
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
