"use client";

import React from "react";
import { format, parseISO } from "date-fns";
import { X, Tv, ExternalLink, Calendar } from "lucide-react";
import { CalendarEvent } from "@/types/event";

interface DayDetailPopoverProps {
  date: string | null;
  events: CalendarEvent[];
  onClose: () => void;
  onSelectEvent: (e: CalendarEvent) => void;
}

const catDot = (c: string) =>
  c === "ranking" ? "cat-dot-ranking" : c === "tournament" ? "cat-dot-tournament" : "cat-dot-scrim";

const catText = (c: string) =>
  c === "ranking" ? "text-amber-400" : c === "tournament" ? "text-cyan-400" : "text-emerald-400";

export const DayDetailPopover: React.FC<DayDetailPopoverProps> = ({
  date,
  events,
  onClose,
  onSelectEvent,
}) => {
  if (!date) return null;

  const dayLabel = format(parseISO(date), "EEE, MMM d");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="day-popover-card max-sm:rounded-b-none max-sm:rounded-t-3xl max-sm:max-w-full max-sm:w-full animate-slideUp sm:animate-scaleIn max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile handle indicator */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto my-2 sm:hidden shrink-0" />
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#e8a33d]" />
            <span className="text-sm font-semibold text-white">{dayLabel}</span>
            <span className="text-xs text-[#52525b]">· {events.length}</span>
          </div>
          <button onClick={onClose} className="toolbar-btn w-6 h-6">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Event rows */}
        <div className="max-h-80 overflow-y-auto divide-y divide-[#1f1f23]">
          {events.map((evt) => (
            <div
              key={evt.id}
              onClick={() => { onSelectEvent(evt); onClose(); }}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.03] transition-colors group"
            >
              {/* Logo / initials */}
              {evt.orgLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={evt.orgLogoUrl}
                  alt={evt.orgName}
                  className="w-9 h-9 rounded-lg object-contain bg-[#111113] border border-[#27272a] shrink-0 p-0.5"
                  onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-[#1c1c20] border border-[#27272a] flex items-center justify-center text-[10px] font-bold text-[#a1a1aa] shrink-0">
                  {evt.orgName.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`${catDot(evt.category)}`} style={{ display: "inline-block" }} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${catText(evt.category)}`}>
                    {evt.category}
                  </span>
                  {evt.region && <span className="text-[10px] text-[#52525b]">· {evt.region}</span>}
                </div>
                <div className="text-sm font-semibold text-white truncate group-hover:text-[#e8a33d] transition-colors">
                  {evt.name}
                </div>
                {evt.orgName && (
                  <div className="text-[11px] text-[#52525b]">{evt.orgName}</div>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {evt.streamLinks?.length > 0 && (
                  <a
                    href={evt.streamLinks[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg text-[#52525b] hover:text-[#e8a33d] hover:bg-[#e8a33d]/10 transition-all"
                  >
                    <Tv className="w-3.5 h-3.5" />
                  </a>
                )}
                <div className="p-1.5 text-[#3f3f46] group-hover:text-[#71717a] transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
