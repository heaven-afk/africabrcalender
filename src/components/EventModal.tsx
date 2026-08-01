"use client";

import React from "react";
import {
  X,
  Calendar,
  Clock,
  MapPin,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#18181C] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fadeInScale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Category color header stripe */}
        <div
          className={`h-1 w-full ${
            event.category === "ranking"
              ? "bg-amber-500"
              : event.category === "tournament"
              ? "bg-cyan-500"
              : "bg-emerald-500"
          }`}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-500 hover:text-white hover:bg-surface-elevated rounded-lg transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 p-5 pb-4">
          <OrgLogo orgName={event.orgName} logoUrl={event.orgLogoUrl} size="lg" />
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <CategoryPill category={event.category} size="sm" />
              {event.region && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-surface-elevated text-neutral-500 border border-surface-border">
                  {event.region}
                </span>
              )}
            </div>
            <h2 className="font-display font-bold text-white text-xl leading-tight">
              {event.name}
            </h2>
            {event.stage && (
              <p className="text-xs text-gold-500/80 font-semibold mt-1">{event.stage}</p>
            )}
            <p className="text-xs text-neutral-500 mt-1">by {event.orgName}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-surface-border" />

        {/* Details */}
        <div className="p-5 space-y-3">

          {/* Date */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-elevated border border-surface-border shrink-0">
              <Calendar className="w-4 h-4 text-gold-500" />
            </div>
            <div>
              <div className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold mb-0.5">
                {event.category === "scrim" ? "Active Period" : "Date Range"}
              </div>
              <div className="text-sm font-semibold text-neutral-200">{formatDateRange(event)}</div>
              {event.category === "scrim" && event.recurrence && (
                <div className="mt-1.5 space-y-0.5 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    {event.recurrence.startTime} – {event.recurrence.endTime} ({event.recurrence.timezone})
                  </div>
                  <div className="text-neutral-500">
                    <span className="text-neutral-600">Days: </span>
                    {event.recurrence.daysOfWeek.map((d) => daysMap[d]).join(", ")}
                  </div>
                  {event.recurrence.exceptions.length > 0 && (
                    <div className="text-neutral-600 text-[11px]">
                      Exceptions: {event.recurrence.exceptions.join(", ")}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Streams */}
          {event.streamLinks && event.streamLinks.length > 0 && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-elevated border border-surface-border shrink-0">
                <Tv className="w-4 h-4 text-gold-500" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold mb-1.5">
                  Broadcast
                </div>
                <div className="space-y-1.5">
                  {event.streamLinks.map((s, i) => (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-surface-border hover:border-gold-500/30 text-xs font-semibold text-neutral-300 hover:text-gold-300 transition-all"
                    >
                      <span>{s.label || `Stream ${i + 1}`}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-neutral-600" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Community */}
          {(event.location?.discordUrl || event.location?.websiteUrl || event.location?.note) && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-elevated border border-surface-border shrink-0">
                <MapPin className="w-4 h-4 text-gold-500" />
              </div>
              <div>
                <div className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold mb-1.5">
                  Community
                </div>
                {event.location.note && (
                  <p className="text-xs text-neutral-400 italic mb-1.5">{event.location.note}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {event.location.discordUrl && (
                    <a
                      href={event.location.discordUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs font-semibold hover:bg-indigo-950/60 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Discord
                    </a>
                  )}
                  {event.location.websiteUrl && (
                    <a
                      href={event.location.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated border border-surface-border text-neutral-300 text-xs font-semibold hover:bg-surface-hover transition-all"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Website
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-surface-border flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface-elevated border border-surface-border text-sm font-semibold text-neutral-300 hover:text-white hover:bg-surface-hover transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
