"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  X, CalendarDays, Clock3, Tv, ExternalLink, AlignLeft,
  Globe2, Gamepad2, MapPin, Building2, ArrowUpRight,
  Bell, BellRing, Check, Loader2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { CalendarEvent } from "@/types/event";
import { CategoryPill } from "./CategoryPill";
import { OrgLogo } from "./OrgLogo";
import { getStreamPlatform } from "@/lib/eventCatalog";
import { getEventTimingStatus, isEventOccurrenceLive } from "@/lib/eventTiming";

interface EventModalProps { event: CalendarEvent | null; occurrenceDate?: string | null; now: Date; onClose: () => void; }
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const REMINDERS_STORAGE_KEY = "esports_event_reminders";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return new Uint8Array([...raw].map((c) => c.charCodeAt(0))) as Uint8Array<ArrayBuffer>;
}

function formatDateRange(event: CalendarEvent) {
  if (event.recurrence?.daysOfWeek?.length === 7 && event.endDate === "2099-12-31") return "Every day";
  try {
    const start = format(parseISO(event.startDate), "MMM d, yyyy");
    const end = format(parseISO(event.endDate), "MMM d, yyyy");
    return start === end ? start : `${start} — ${end}`;
  } catch { return `${event.startDate} — ${event.endDate}`; }
}

export const EventModal: React.FC<EventModalProps> = ({ event, occurrenceDate, now, onClose }) => {
  const [isReminded, setIsReminded] = useState(false);
  const [remindLoading, setRemindLoading] = useState(false);

  // Sync reminder state from localStorage
  useEffect(() => {
    if (!event) return;
    try {
      const stored = localStorage.getItem(REMINDERS_STORAGE_KEY);
      const list: string[] = stored ? JSON.parse(stored) : [];
      setIsReminded(list.includes(event.id));
    } catch {
      setIsReminded(false);
    }
  }, [event?.id]);

  useEffect(() => {
    if (!event) return;
    const onKey = (keyEvent: KeyboardEvent) => { if (keyEvent.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [event, onClose]);

  const handleToggleReminder = useCallback(async () => {
    if (!event || remindLoading) return;
    setRemindLoading(true);

    try {
      // 1. Check browser push capability
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        alert("Push notifications are not supported in this browser.");
        setRemindLoading(false);
        return;
      }

      // 2. Request permission if needed
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("Please allow browser notifications to receive event reminders.");
        setRemindLoading(false);
        return;
      }

      // 3. Register SW and get or create subscription
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const vapidKey =
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
          "BEmDROyPdokhCQ_7bMM-Z8CLlefcwJwNRQmkhxQpX7OvR8KqshQ97aOnj69GQKScq58nziLj8yKzRtYRMCfxpgw";
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      }

      const raw = sub.toJSON();
      const keys = {
        p256dh: raw.keys?.p256dh || "",
        auth: raw.keys?.auth || "",
      };

      const nextState = !isReminded;

      // 4. Update on server
      await fetch("/api/notifications/remind-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys,
          eventId: event.id,
          action: nextState ? "add" : "remove",
        }),
      });

      // 5. Update localStorage
      const stored = localStorage.getItem(REMINDERS_STORAGE_KEY);
      let list: string[] = stored ? JSON.parse(stored) : [];
      if (nextState) {
        if (!list.includes(event.id)) list.push(event.id);
      } else {
        list = list.filter((id) => id !== event.id);
      }
      localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(list));

      setIsReminded(nextState);
    } catch (err) {
      console.error("[Event Reminder] Error toggling reminder:", err);
    } finally {
      setRemindLoading(false);
    }
  }, [event, isReminded, remindLoading]);

  if (!event) return null;
  const primaryLink = event.streamLinks?.[0]?.url || event.location?.websiteUrl;
  const timezone = event.recurrence?.timezone || event.location?.timezone;
  const live = occurrenceDate
    ? isEventOccurrenceLive(event, occurrenceDate, now)
    : getEventTimingStatus(event, now) === "live";

  return (
    <div className="drawer-backdrop animate-fadeIn" onMouseDown={onClose}>
      <aside className="event-drawer" role="dialog" aria-modal="true" aria-labelledby="event-drawer-title" onMouseDown={(e) => e.stopPropagation()}>
        <header className="drawer-header">
          <span>Event details</span>
          <div className="drawer-header__actions">
            <button
              type="button"
              onClick={handleToggleReminder}
              disabled={remindLoading}
              className={`drawer-header__bell ${isReminded ? "is-active" : ""}`}
              aria-label={isReminded ? "Reminder is set — click to remove" : "Remind me when event starts"}
              title={isReminded ? "Reminder is set — click to remove" : "Remind me when event starts"}
            >
              {remindLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isReminded ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            </button>
            <button onClick={onClose} aria-label="Close event details"><X /></button>
          </div>
        </header>

        <div className="event-drawer__body">
          <div className="event-drawer__identity">
            <OrgLogo orgName={event.orgName} logoUrl={event.orgLogoUrl} size="lg" />
            <div>
              <div className="event-drawer__labels"><CategoryPill category={event.category} size="sm" />{live && <span className="view-live-status"><i />Live now</span>}</div>
              <h2 id="event-drawer-title">{event.name}</h2>
              {event.stage && <p>{event.stage}</p>}
            </div>
          </div>

          {/* Event Reminder Action Card */}
          <div className={`event-reminder-card ${isReminded ? "is-active" : ""}`}>
            <div className="event-reminder-card__left">
              <div className="event-reminder-card__icon-wrap">
                {isReminded ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              </div>
              <div>
                <div className="event-reminder-card__title">
                  {isReminded ? "Reminder active" : "Event reminder"}
                </div>
                <p className="event-reminder-card__sub">
                  {isReminded
                    ? "You will receive a notification when this event starts"
                    : "Get notified when this event starts and goes live"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleReminder}
              disabled={remindLoading}
              className={`event-reminder-card__btn ${isReminded ? "is-active" : ""}`}
            >
              {remindLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isReminded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Reminded</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5" />
                  <span>Remind me</span>
                </>
              )}
            </button>
          </div>

          <div className="event-facts">
            <div><span><CalendarDays />Schedule</span><strong>{formatDateRange(event)}</strong></div>
            {(event.startTime || event.recurrence?.startTime) && <div><span><Clock3 />Time</span><strong>{event.startTime || event.recurrence?.startTime}{(event.endTime || event.recurrence?.endTime) ? `–${event.endTime || event.recurrence?.endTime}` : ""}{timezone ? ` · ${timezone}` : ""}</strong></div>}
            <div><span><Building2 />Organizer</span><strong>{event.orgName}</strong></div>
            {event.game && <div><span><Gamepad2 />Game</span><strong>{event.game}</strong></div>}
            {event.region && <div><span><MapPin />Region</span><strong>{event.region}</strong></div>}
          </div>

          {(event.description || event.location?.note) && (
            <section className="drawer-section event-description">
              <div className="drawer-section__title"><AlignLeft /><span>About this event</span></div>
              <p>{event.description || event.location.note}</p>
            </section>
          )}

          {event.recurrence && (
            <section className="drawer-section">
              <div className="drawer-section__title"><Clock3 /><span>Recurring schedule</span></div>
              <p>{event.recurrence.daysOfWeek.map((day) => DAYS[day]).join(", ")}</p>
              <strong>{event.recurrence.startTime}–{event.recurrence.endTime} · {event.recurrence.timezone || "UTC"}</strong>
            </section>
          )}

          {event.streamLinks?.length > 0 && (
            <section className="drawer-section">
              <div className="drawer-section__title"><Tv /><span>Broadcasts</span></div>
              <div className="drawer-links">
                {event.streamLinks.map((stream, index) => { const platform = getStreamPlatform(stream.label, stream.url); return (
                  <a key={index} href={stream.url} target="_blank" rel="noopener noreferrer">
                    <span>{platform.logo ? <>{/* eslint-disable-next-line @next/next/no-img-element */}<img className="stream-mark" src={platform.logo} alt="" /></> : <Tv />}{platform.label}</span><ExternalLink />
                  </a>
                ); })}
              </div>
            </section>
          )}

          {(event.location?.discordUrl || event.location?.websiteUrl) && (
            <section className="drawer-section">
              <div className="drawer-section__title"><Globe2 /><span>Official links</span></div>
              <div className="drawer-links">
                {event.location.discordUrl && <a href={event.location.discordUrl} target="_blank" rel="noopener noreferrer"><span>{/* eslint-disable-next-line @next/next/no-img-element */}<img className="discord-mark" src="https://cdn.simpleicons.org/discord/5865F2" alt="" /> Discord</span><ExternalLink /></a>}
                {event.location.websiteUrl && <a href={event.location.websiteUrl} target="_blank" rel="noopener noreferrer"><span><Globe2 /> Website</span><ExternalLink /></a>}
              </div>
            </section>
          )}
        </div>

        <footer className="drawer-footer">
          <button onClick={onClose}>Close</button>
          {primaryLink && <a href={primaryLink} target="_blank" rel="noopener noreferrer">Open official link <ArrowUpRight /></a>}
        </footer>
      </aside>
    </div>
  );
};
