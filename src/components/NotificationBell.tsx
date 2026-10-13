"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bell, BellOff, BellRing, Check, ChevronDown, Loader2, X,
  Trophy, Crosshair, Medal, Award, Mic2, AlertCircle, Share,
} from "lucide-react";
import { EventCategory } from "@/types/event";

type PermissionState = "default" | "granted" | "denied";
type SubState = "idle" | "subscribed" | "denied" | "loading";

const FALLBACK_VAPID_PUBLIC_KEY =
  "BEmDROyPdokhCQ_7bMM-Z8CLlefcwJwNRQmkhxQpX7OvR8KqshQ97aOnj69GQKScq58nziLj8yKzRtYRMCfxpgw";

async function getVapidPublicKey(): Promise<string> {
  if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  }
  try {
    const res = await fetch("/api/notifications/vapid-public-key");
    const json = await res.json();
    if (json.publicKey) return json.publicKey;
  } catch {
    // fallback
  }
  return FALLBACK_VAPID_PUBLIC_KEY;
}

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isIosSafari, setIsIosSafari] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const endpointRef = useRef<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Detect platform and subscription status on mount
  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isIos && !isStandalone && !("PushManager" in window)) {
      setIsIosSafari(true);
    }

    if (!("Notification" in window)) return;

    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }

    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) {
            endpointRef.current = sub.endpoint;
            setState("subscribed");
          }
        });
      });
    }

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close panel on outside click
  useEffect(() => {
    if (!settingsOpen) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.closest?.(".notif-panel") ||
        target?.closest?.(".notif-bell") ||
        target?.closest?.(".notif-backdrop")
      ) {
        return;
      }
      setSettingsOpen(false);
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
    setErrorMsg(null);
    setState("loading");

    try {
      if (typeof window === "undefined" || !("Notification" in window)) {
        throw new Error("Notifications are not supported in this browser.");
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        return;
      }

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Push notifications require Service Worker support.");
      }

      const vapidKey = await getVapidPublicKey();
      if (!vapidKey) throw new Error("Push server public key is unavailable.");

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      }

      endpointRef.current = sub.endpoint;
      const { endpoint, keys } = subToJson(sub);

      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint, keys, categories: [], isAdmin }),
      });

      setState("subscribed");
    } catch (err: any) {
      console.error("[Push] Subscribe error:", err);
      setErrorMsg(err.message || "Failed to enable notifications. Please try again.");
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

  const BellIcon = state === "subscribed" ? BellRing : state === "denied" ? BellOff : Bell;

  const panelContent = (
    <>
      <header className="notif-panel__header">
        <span>{isAdmin ? "Admin Alerts" : "Notifications"}</span>
        <button onClick={() => setSettingsOpen(false)} aria-label="Close notification settings"><X /></button>
      </header>

      <div className="notif-panel__body">
        {/* iOS Safari Prompt when not PWA */}
        {isIosSafari && state !== "subscribed" ? (
          <div className="notif-panel__alert">
            <Share aria-hidden="true" />
            <div>
              <strong>Add to Home Screen on iOS</strong>
              <p>To receive notifications on iPhone or iPad, tap <strong>Share</strong> in Safari and select <strong>Add to Home Screen</strong>.</p>
            </div>
          </div>
        ) : state === "denied" ? (
          /* Blocked notifications state */
          <div className="notif-panel__alert">
            <BellOff aria-hidden="true" />
            <div>
              <strong>Notifications are blocked</strong>
              <p>Your browser is blocking notifications for this site. Click the padlock or site settings icon in your address bar and set Notifications to <strong>Allow</strong>.</p>
            </div>
          </div>
        ) : state !== "subscribed" ? (
          /* Onboarding state — prompt to enable */
          <div className="notif-panel__prompt">
            <p className="notif-panel__prompt-title">
              {isAdmin ? "Turn on review alerts" : "Never miss an esports event"}
            </p>
            <p className="notif-panel__prompt-sub">
              {isAdmin
                ? "Get real-time push alerts whenever an organizer submits an event for review."
                : "Receive push notifications for tournament schedules, match times, and live games."}
            </p>
            {errorMsg && (
              <p className="text-xs text-red-400 leading-snug">{errorMsg}</p>
            )}
            <button
              type="button"
              className="notif-panel__enable-btn"
              onClick={register}
              disabled={state === "loading"}
            >
              {state === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
              <span>{state === "loading" ? "Enabling…" : "Enable notifications"}</span>
            </button>
          </div>
        ) : (
          /* Subscribed state — category preferences */
          <>
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
          </>
        )}
      </div>

      {state === "subscribed" && (
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
      )}
    </>
  );

  return (
    <div className="notif-bell" ref={panelRef}>
      <button
        type="button"
        className={`icon-action notif-bell__trigger${state === "subscribed" ? " is-active" : ""}${state === "denied" ? " is-denied" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          setSettingsOpen((v) => !v);
        }}
        aria-label={
          state === "subscribed" ? "Notification settings" :
          state === "denied"     ? "Notifications blocked in browser settings" :
          state === "loading"    ? "Enabling notifications…" :
          "Enable notifications"
        }
        title={
          state === "subscribed" ? "Notification settings" :
          state === "denied"     ? "Notifications blocked — click for help" :
          "Enable notifications"
        }
      >
        {state === "loading" ? <Loader2 className="animate-spin" aria-hidden="true" /> : <BellIcon aria-hidden="true" />}
      </button>

      {settingsOpen && (
        isMobile && mounted ? (
          createPortal(
            <div className="notif-backdrop animate-fadeIn" onClick={() => setSettingsOpen(false)}>
              <div
                className="notif-panel notif-panel--mobile"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-label="Notification settings"
              >
                {panelContent}
              </div>
            </div>,
            document.body
          )
        ) : (
          <div className="notif-panel animate-fadeIn" role="dialog" aria-label="Notification settings">
            {panelContent}
          </div>
        )
      )}
    </div>
  );
};
