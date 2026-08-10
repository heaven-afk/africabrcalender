"use client";

import React, { useState } from "react";
import { X, Download, Calendar, Info } from "lucide-react";
import { CalendarEvent } from "@/types/event";
import { format } from "date-fns";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  currentMonth: Date;
}

function generateICS(events: CalendarEvent[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Esports Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Esports Calendar",
    "X-WR-TIMEZONE:UTC",
  ];

  for (const evt of events) {
    const uid = `${evt.id}@africabr.calendar`;
    const dtstart = evt.startDate.replace(/-/g, "");
    const dtend = evt.endDate.replace(/-/g, "");
    const summary = `${evt.name}${evt.stage ? " - " + evt.stage : ""}`;
    const description = [
      `Organized by: ${evt.orgName}`,
      evt.region ? `Region: ${evt.region}` : "",
      evt.category ? `Type: ${evt.category.toUpperCase()}` : "",
      evt.streamLinks?.length ? `Stream: ${evt.streamLinks[0].url}` : "",
    ]
      .filter(Boolean)
      .join("\\n");

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTART;VALUE=DATE:${dtstart}`,
      `DTEND;VALUE=DATE:${dtend}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `CATEGORIES:${evt.category.toUpperCase()}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function downloadICS(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const ExportModal: React.FC<ExportModalProps> = ({
  open,
  onClose,
  events,
  currentMonth,
}) => {
  const [downloading, setDownloading] = useState<string | null>(null);

  if (!open) return null;

  const monthStr = format(currentMonth, "MMM-yyyy");
  const monthLabel = format(currentMonth, "MMMM yyyy");

  const monthEvents = events.filter((e) => {
    const m = format(currentMonth, "yyyy-MM");
    return e.startDate.startsWith(m) || e.endDate.startsWith(m) ||
      (e.startDate <= `${m}-31` && e.endDate >= `${m}-01`);
  });

  const handleDownload = (scope: "all" | "month") => {
    setDownloading(scope);
    setTimeout(() => {
      const evts = scope === "month" ? monthEvents : events;
      const ics = generateICS(evts);
      downloadICS(ics, scope === "month" ? `esports-calendar-${monthStr}.ics` : `esports-calendar-full.ics`);
      setDownloading(null);
    }, 300);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="match-dialog relative w-full max-w-md overflow-hidden animate-fadeInScale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
          <div className="flex items-center gap-2">
            <span className="font-display font-black uppercase text-white text-lg tracking-tight">Add to your calendar</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Calendar ICS */}
          <div>
            <div className="flex items-center gap-2 mb-3 text-[11px] font-bold tracking-widest uppercase text-neutral-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendar File (.ics)</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => handleDownload("all")}
                disabled={!!downloading}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-sm font-semibold text-neutral-200 hover:border-neutral-500 transition-all disabled:opacity-50"
              >
                {downloading === "all" ? (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-neutral-400 border-t-transparent animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-neutral-400" />
                )}
                Full schedule
              </button>
              <button
                onClick={() => handleDownload("month")}
                disabled={!!downloading}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-sm font-semibold text-neutral-200 hover:border-neutral-500 transition-all disabled:opacity-50"
              >
                {downloading === "month" ? (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-neutral-400 border-t-transparent animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-neutral-400" />
                )}
                {monthLabel} only
              </button>
            </div>
          </div>

          {/* Warning note */}
          <div className="flex items-start gap-2.5 p-3 border border-[#222624] bg-[#050606]">
            <Info className="w-4 h-4 text-[#c9ff70] shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-400 leading-relaxed">
              Calendar files work with Google Calendar, Apple Calendar, Outlook and most calendar apps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
