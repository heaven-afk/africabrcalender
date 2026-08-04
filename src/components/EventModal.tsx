"use client";

import React from "react";
import {
  X,
  Calendar,
  Clock,
  Tv,
  MessageSquare,
  ExternalLink,
  Globe,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { CalendarEvent } from "@/types/event";
import { CategoryPill } from "./CategoryPill";
import { OrgLogo } from "./OrgLogo";

interface EventModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
}

const daysMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatDateRange(evt: CalendarEvent): string {
  try {
    const s = format(parseISO(evt.startDate), "MMMM d, yyyy");
    const e = format(parseISO(evt.endDate), "MMMM d, yyyy");
    return s === e ? s : `${s} – ${e}`;
  } catch {
    return `${evt.startDate} – ${evt.endDate}`;
  }
}

export const EventModal: React.FC<EventModalProps> = ({ event, onClose }) => {
  if (!event) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xl animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#0e0e14]/95 backdrop-blur-2xl border border-white/[0.08] max-sm:rounded-b-none max-sm:rounded-t-[28px] sm:rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.9)] overflow-hidden animate-slideUp sm:animate-scaleIn max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile handle indicator */}
        <div className="w-10 h-1 bg-white/25 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Category color header stripe */}
        <div
          className={`h-1.5 w-full ${
            event.category === "ranking"
              ? "bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
              : event.category === "tournament"
              ? "bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.6)]"
              : "bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
          }`}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 p-6 pb-4">
          <OrgLogo orgName={event.orgName} logoUrl={event.orgLogoUrl} size="lg" />
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <CategoryPill category={event.category} size="sm" />
              {event.region && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-md bg-white/[0.04] text-zinc-400 border border-white/10">
                  {event.region}
                </span>
              )}
            </div>
            <h2 className="font-display font-bold text-white text-xl leading-tight">
              {event.name}
            </h2>
            {event.stage && (
              <p className="text-xs text-amber-400 font-semibold mt-1">{event.stage}</p>
            )}
            <p className="text-xs text-zinc-400 mt-1">Organized by <strong className="text-zinc-200">{event.orgName}</strong></p>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-6 h-px bg-white/10" />

        {/* Details */}
        <div className="p-6 space-y-4">

          {/* Date */}
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Dates & Schedule</div>
              <div className="text-sm font-medium text-zinc-200 mt-0.5">{formatDateRange(event)}</div>
            </div>
          </div>

          {/* Scrim Recurrence Schedule */}
          {event.category === "scrim" && event.recurrence && (
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Daily Recurrence</div>
                <div className="text-sm font-semibold text-emerald-300 mt-0.5">
                  {event.recurrence.daysOfWeek.map((d) => daysMap[d]).join(", ")}
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  {event.recurrence.startTime} – {event.recurrence.endTime} ({event.recurrence.timezone || "Africa/Lagos"})
                </div>
              </div>
            </div>
          )}

          {/* Stream Links */}
          {event.streamLinks && event.streamLinks.length > 0 && (
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
                <Tv className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Official Broadcast</div>
                <div className="flex flex-wrap gap-2">
                  {event.streamLinks.map((s, idx) => (
                    <a
                      key={idx}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-amber-500/40 text-xs font-semibold text-zinc-200 hover:text-amber-400 transition-all"
                    >
                      <span>{s.label || "Watch Stream"}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* External Links / Socials */}
          {(event.location?.discordUrl || event.location?.websiteUrl) && (
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Community Links</div>
                <div className="flex flex-wrap gap-2">
                  {event.location?.discordUrl && (
                    <a
                      href={event.location.discordUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Discord Server</span>
                    </a>
                  )}

                  {event.location?.websiteUrl && (
                    <a
                      href={event.location.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all"
                    >
                      <span>Official Website</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
