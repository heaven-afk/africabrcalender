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
  c === "ranking" ? "cat-dot-ranking" : c === "tournament" ? "cat-dot-tournament" : c === "award" ? "cat-dot-award" : c === "podcast" ? "cat-dot-podcast" : "cat-dot-scrim";

const catText = (c: string) =>
  c === "ranking" ? "text-amber-400" : c === "tournament" ? "text-cyan-400" : c === "award" ? "text-purple-400" : c === "podcast" ? "text-rose-400" : "text-emerald-400";

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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="day-popover-card max-sm:rounded-b-none max-sm:rounded-t-[28px] max-sm:max-w-full max-sm:w-full animate-slideUp sm:animate-scaleIn max-h-[85vh] flex flex-col border border-white/[0.08] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile handle indicator */}
        <div className="w-10 h-1 bg-white/25 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-sm font-semibold text-white">{dayLabel}</span>
            <span className="text-xs text-zinc-500">· {events.length} event{events.length !== 1 ? "s" : ""}</span>
          </div>
          <button onClick={onClose} className="toolbar-btn w-7 h-7 rounded-full">
            <X className="w-3.5 h-3.5 text-zinc-400" />
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
