"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell, BellOff, BellRing, Check, ChevronDown, Loader2, X,
  Trophy, Crosshair, Medal, Award, Mic2,
} from "lucide-react";
import { EventCategory } from "@/types/event";

type PermissionState = "default" | "granted" | "denied";
type SubState = "idle" | "subscribed" | "denied" | "loading";

const CATEGORY_OPTIONS: { id: EventCategory; label: string; icon: React.ElementType }[] = [
  { id: "tournament", label: "Tournaments", icon: Trophy },
  { id: "scrim",      label: "Scrims",       icon: Crosshair },
  { id: "ranking",    label: "Rankings",     icon: Medal },
  { id: "award",      label: "Awards",       icon: Award },
  { id: "podcast",    label: "Talks",        icon: Mic2 },
];

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return new Uint8Array([...raw].map((c) => c.charCodeAt(0))) as Uint8Array<ArrayBuffer>;
}

function subToJson(sub: PushSubscription) {
  const raw = sub.toJSON();
  return {
    endpoint: sub.endpoint,
    keys: {
      p256dh: raw.keys?.p256dh ?? "",
      auth: raw.keys?.auth ?? "",
    },
  };
}

interface NotificationBellProps {
  /** Pass true when rendered inside the /admin route */
  isAdmin?: boolean;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ isAdmin = false }) => {
  const [state, setState] = useState<SubState>("idle");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [allEvents, setAllEvents] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedTick, setSavedTick] = useState(false);
  const endpointRef = useRef<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Detect current subscription state on mount
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const permission = Notification.permission as PermissionState;
    if (permission === "denied") { setState("denied"); return; }
    if (permission !== "granted") return;

    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) {
          endpointRef.current = sub.endpoint;
          setState("subscribed");
        }
      });
    });
  }, []);

  // Close panel on outside click
  useEffect(() => {
    if (!settingsOpen) return;
    const close = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [settingsOpen]);

  // Close panel on Escape
  useEffect(() => {
    if (!settingsOpen) return;
    const close = (e: KeyboardEvent) => { if (e.key === "Escape") setSettingsOpen(false); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [settingsOpen]);

  const register = useCallback(async () => {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) { console.error("[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set."); return; }

    setState("loading");

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState("denied"); return; }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      endpointRef.current = sub.endpoint;
      const { endpoint, keys } = subToJson(sub);

      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint, keys, categories: [], isAdmin }),
      });

      setState("subscribed");
      setSettingsOpen(true);
    } catch (err) {
      console.error("[Push] Subscribe error:", err);
      setState("idle");
    }
  }, [isAdmin]);

  const unsubscribe = useCallback(async () => {
    if (!endpointRef.current) return;

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      await sub?.unsubscribe();

      await fetch("/api/notifications/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: endpointRef.current }),
      });

      endpointRef.current = null;
      setState("idle");
      setSettingsOpen(false);
      setCategories([]);
      setAllEvents(true);
    } catch (err) {
      console.error("[Push] Unsubscribe error:", err);
    }
  }, []);

  const savePreferences = useCallback(async () => {
    if (!endpointRef.current) return;
    setSaving(true);

    const selectedCategories = allEvents ? [] : categories;

    try {
      await fetch("/api/notifications/subscribe", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: endpointRef.current, categories: selectedCategories }),
      });
      setSavedTick(true);
      setTimeout(() => { setSavedTick(false); setSettingsOpen(false); }, 1000);
    } catch (err) {
      console.error("[Push] Preferences save error:", err);
    } finally {
      setSaving(false);
    }
  }, [allEvents, categories]);

  const toggleCategory = (id: EventCategory) => {
    setCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;

  const BellIcon = state === "subscribed" ? BellRing : state === "denied" ? BellOff : Bell;

  return (
    <div className="notif-bell" ref={panelRef}>
      <button
        className={`icon-action notif-bell__trigger${state === "subscribed" ? " is-active" : ""}${state === "denied" ? " is-denied" : ""}`}
        onClick={() => {
          if (state === "loading") return;
          if (state === "subscribed") { setSettingsOpen((v) => !v); return; }
          if (state === "denied") return;
          register();
        }}
        aria-label={
          state === "subscribed" ? "Notification settings" :
          state === "denied"     ? "Notifications blocked in browser settings" :
          state === "loading"    ? "Enabling notifications…" :
          "Enable notifications"
        }
        title={
          state === "subscribed" ? "Notification settings" :
          state === "denied"     ? "Notifications blocked — check browser settings" :
          "Enable notifications"
        }
        disabled={state === "loading"}
      >
        {state === "loading" ? <Loader2 className="animate-spin" aria-hidden="true" /> : <BellIcon aria-hidden="true" />}
      </button>

      {settingsOpen && state === "subscribed" && (
        <div className="notif-panel" role="dialog" aria-label="Notification settings">
          <header className="notif-panel__header">
            <span>{isAdmin ? "Admin Alerts" : "Notifications"}</span>
            <button onClick={() => setSettingsOpen(false)} aria-label="Close notification settings"><X /></button>
          </header>

          <div className="notif-panel__body">
            {isAdmin ? (
              <p className="notif-panel__hint">
                You will receive alerts whenever new events are submitted for review.
              </p>
            ) : (
              <>
                <div
                  className={`notif-master-toggle ${allEvents ? "is-active" : ""}`}
                  onClick={() => {
                    setAllEvents((prev) => {
                      const next = !prev;
                      if (next) setCategories([]);
                      return next;
                    });
                  }}
                  role="switch"
                  aria-checked={allEvents}
                  tabIndex={0}
                >
                  <div className="notif-master-toggle__info">
                    <span className="notif-master-toggle__label">All events</span>
                    <span className="notif-master-toggle__sub">Notify me about everything</span>
                  </div>
                  <div className={`notif-switch ${allEvents ? "is-on" : ""}`}>
                    <div className="notif-switch__thumb" />
                  </div>
                </div>

                {!allEvents && (
                  <div className="notif-categories">
                    <span className="notif-categories__section-title">Filter by category</span>
                    {CATEGORY_OPTIONS.map(({ id, label, icon: Icon }) => {
                      const active = categories.includes(id);
                      return (
                        <div
                          key={id}
                          className={`notif-cat-row ${active ? "is-active" : ""}`}
                          onClick={() => toggleCategory(id)}
                          role="switch"
                          aria-checked={active}
                          tabIndex={0}
                        >
                          <div className="notif-cat-row__left">
                            <div className={`notif-cat-row__icon ${active ? "is-active" : ""}`}>
                              <Icon aria-hidden="true" />
                            </div>
                            <span className="notif-cat-row__name">{label}</span>
                          </div>
                          <div className={`notif-switch ${active ? "is-on" : ""}`}>
                            <div className="notif-switch__thumb" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          <footer className="notif-panel__footer">
            <button className="notif-panel__unsub" onClick={unsubscribe}>
              <BellOff aria-hidden="true" />Turn off
            </button>
            {!isAdmin && (
              <button
                className="notif-panel__save"
                onClick={savePreferences}
                disabled={saving || (!allEvents && categories.length === 0)}
              >
                {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : savedTick ? <Check aria-hidden="true" /> : null}
                {savedTick ? "Saved" : "Save"}
              </button>
            )}
          </footer>
        </div>
      )}
    </div>
  );
};
