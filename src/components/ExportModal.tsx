"use client";

import React, { useState } from "react";
import {
  Calendar, Check, ChevronDown, Copy, Download, ExternalLink,
  RefreshCw, ShieldCheck, Unlink, X,
} from "lucide-react";
import { format } from "date-fns";
import { CalendarEvent } from "@/types/event";
import { generateICS, getMonthlyExportEvents } from "@/lib/calendarExport";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  currentMonth: Date;
}

type ExportScope = "all" | "month";
type CalendarProvider = "google" | "apple" | "outlook" | "download";

const providerMeta: Record<CalendarProvider, { name: string; mark: string; description: string }> = {
  google: { name: "Google Calendar", mark: "G", description: "Copy feed and open Google" },
  apple: { name: "Apple Calendar", mark: "A", description: "Open a live subscription" },
  outlook: { name: "Outlook", mark: "O", description: "Copy feed and open Outlook" },
  download: { name: "Download .ics file", mark: "↓", description: "A one-time calendar snapshot" },
};

function downloadICS(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
}

export const ExportModal: React.FC<ExportModalProps> = ({ open, onClose, events, currentMonth }) => {
  const [scope, setScope] = useState<ExportScope>("all");
  const [working, setWorking] = useState<CalendarProvider | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!open) return null;

  const month = format(currentMonth, "yyyy-MM");
  const monthLabel = format(currentMonth, "MMMM yyyy");
  const feedPath = scope === "month"
    ? `/api/calendar?scope=month&month=${encodeURIComponent(month)}`
    : "/api/calendar?scope=all";

  const handleProvider = async (provider: CalendarProvider) => {
    setWorking(provider);
    setNotice(null);
    const feedUrl = new URL(feedPath, window.location.origin).toString();

    try {
      if (provider === "download") {
        const exportEvents = scope === "month" ? getMonthlyExportEvents(events, month) : events;
        downloadICS(
          generateICS(exportEvents, new Date(), scope === "month" ? `${monthLabel} Esports Calendar` : "Esports Calendar"),
          scope === "month" ? `esports-calendar-${month}.ics` : "esports-calendar-full.ics",
        );
        setNotice("Your calendar file has been downloaded.");
        return;
      }

      if (provider === "apple") {
        void copyText(feedUrl);
        window.location.href = feedUrl.replace(/^https?:/, "webcal:");
        setNotice("Opening Apple Calendar. The feed address was also copied.");
        return;
      }

      const providerUrl = provider === "google"
        ? "https://calendar.google.com/calendar/u/0/r/settings/addbyurl"
        : "https://outlook.live.com/calendar/0/view/month";
      window.open(providerUrl, "_blank", "noopener,noreferrer");
      await copyText(feedUrl);
      setNotice(provider === "google"
        ? "Feed copied — paste it into Google Calendar’s ‘From URL’ field."
        : "Feed copied — choose Add calendar → Subscribe from web, then paste it.");
    } finally {
      setWorking(null);
    }
  };

  const copyFeed = async () => {
    await copyText(new URL(feedPath, window.location.origin).toString());
    setNotice("Live calendar feed address copied.");
  };

  return (
    <div className="calendar-modal-backdrop" onClick={onClose}>
      <div className="calendar-dialog" role="dialog" aria-modal="true" aria-labelledby="calendar-dialog-title" onClick={(event) => event.stopPropagation()}>
        <header className="calendar-dialog__header">
          <span className="calendar-dialog__icon"><Calendar /></span>
          <div>
            <span className="calendar-dialog__eyebrow">Live calendar sync</span>
            <h2 id="calendar-dialog-title">Add the schedule</h2>
            <p>Follow every event without checking back manually.</p>
          </div>
          <button onClick={onClose} className="calendar-dialog__close" aria-label="Close calendar options"><X /></button>
        </header>

        <div className="calendar-dialog__body">
          <section className="calendar-step">
            <header className="calendar-step__heading"><span>01</span><div><h3>Choose the schedule</h3><p>You can follow everything or only the month in view.</p></div></header>
            <div className="calendar-scope-grid">
              <button type="button" onClick={() => { setScope("all"); setNotice(null); }} className={scope === "all" ? "is-selected" : ""}>
                <span><RefreshCw /></span><div><strong>Full schedule</strong><small>All current and future events</small></div>{scope === "all" && <Check />}
              </button>
              <button type="button" onClick={() => { setScope("month"); setNotice(null); }} className={scope === "month" ? "is-selected" : ""}>
                <span><Calendar /></span><div><strong>{monthLabel}</strong><small>Only this month’s schedule</small></div>{scope === "month" && <Check />}
              </button>
            </div>
          </section>

          <section className="calendar-step">
            <header className="calendar-step__heading"><span>02</span><div><h3>Choose your calendar</h3><p>Subscriptions stay connected when event details change.</p></div></header>
            <div className="calendar-provider-grid">
              {(["google", "apple", "outlook"] as CalendarProvider[]).map((provider) => {
                const meta = providerMeta[provider];
                const busy = working === provider;
                return (
                  <button key={provider} type="button" onClick={() => handleProvider(provider)} disabled={working !== null} className={`calendar-provider calendar-provider--${provider}`}>
                    <span className="calendar-provider__mark">{busy ? <i /> : meta.mark}</span>
                    <span><strong>{meta.name}</strong><small>{meta.description}</small></span>
                    <ExternalLink className="calendar-provider__action" />
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={() => handleProvider("download")} disabled={working !== null} className="calendar-download-fallback">
              <span><Download /></span><div><strong>{providerMeta.download.name}</strong><small>{providerMeta.download.description} — it will not update automatically.</small></div><Download />
            </button>
          </section>

          {notice && <div className="calendar-export-notice" role="status"><Check /><span>{notice}</span></div>}

          <section className="calendar-step calendar-step--guide">
            <header className="calendar-step__heading"><span>03</span><div><h3>Know how it works</h3><p>Syncing and removal stay under your control.</p></div></header>
            <div className="calendar-guide-list">
              <details open>
                <summary><span><RefreshCw />How syncing works</span><ChevronDown /></summary>
                <div className="calendar-guide-copy">
                  <p><strong>Subscriptions stay current.</strong> If an event’s date, time or details change here, your calendar receives the update automatically.</p>
                  <p><strong>Refreshes are not instant.</strong> Google, Apple and Outlook decide when to check for changes, so an update can take several hours to appear.</p>
                  <p><strong>Downloads are snapshots.</strong> A downloaded .ics file never receives later changes; choose a provider subscription for automatic updates.</p>
                </div>
              </details>
              <details>
                <summary><span><Unlink />How to unsubscribe</span><ChevronDown /></summary>
                <div className="calendar-unsubscribe-list">
                  <div><b>G</b><p><strong>Google Calendar</strong><span>Open calendar settings, select the subscribed calendar, then choose Remove calendar → Unsubscribe.</span></p></div>
                  <div><b>A</b><p><strong>Apple Calendar</strong><span>Open Calendars, tap or right-click the subscription, then choose Unsubscribe or Delete.</span></p></div>
                  <div><b>O</b><p><strong>Outlook</strong><span>Open the subscribed calendar’s menu or settings, then choose Remove or Delete calendar.</span></p></div>
                </div>
              </details>
            </div>
          </section>

          <footer className="calendar-dialog__footer">
            <div><ShieldCheck /><span><strong>Read-only and private</strong><small>Subscribing never gives us access to your calendar account.</small></span></div>
            <button type="button" onClick={copyFeed}><Copy />Copy feed</button>
          </footer>
        </div>
      </div>
    </div>
  );
};
