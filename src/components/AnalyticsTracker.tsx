"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnalyticsEventData } from "@/lib/analytics-client";

const VISITOR_KEY = "ec_analytics_visitor";
const SESSION_KEY = "ec_analytics_session";
const SESSION_TIMEOUT = 30 * 60 * 1000;

function randomId(prefix: string) {
  const value = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${value}`;
}

function getIdentity() {
  const now = Date.now();
  let visitorId = localStorage.getItem(VISITOR_KEY);
  if (!visitorId) {
    visitorId = randomId("visitor");
    localStorage.setItem(VISITOR_KEY, visitorId);
  }

  let session: { id: string; lastActivity: number } | null = null;
  try { session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { session = null; }
  if (!session || !session.id || now - session.lastActivity > SESSION_TIMEOUT) session = { id: randomId("session"), lastActivity: now };
  session.lastActivity = now;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { visitorId, sessionId: session.id };
}

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin") || navigator.doNotTrack === "1" || ["localhost", "127.0.0.1"].includes(window.location.hostname)) return;

    let identity: ReturnType<typeof getIdentity>;
    try { identity = getIdentity(); } catch { return; }
    const startedAt = Date.now();
    let maxScrollDepth = 0;
    let lastPath = pathname;

    const send = (eventName: string, data: AnalyticsEventData = {}, beacon = false) => {
      const payload = JSON.stringify({
        ...identity,
        eventName,
        path: window.location.pathname,
        title: document.title,
        referrer: document.referrer || null,
        occurredAt: new Date().toISOString(),
        durationSeconds: Math.max(0, Math.round((Date.now() - startedAt) / 1000)),
        scrollDepth: maxScrollDepth,
        data: {
          ...data,
          utmSource: new URLSearchParams(window.location.search).get("utm_source"),
          utmMedium: new URLSearchParams(window.location.search).get("utm_medium"),
          utmCampaign: new URLSearchParams(window.location.search).get("utm_campaign"),
        },
      });
      if (beacon && navigator.sendBeacon) navigator.sendBeacon("/api/analytics/collect", new Blob([payload], { type: "application/json" }));
      else fetch("/api/analytics/collect", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => undefined);
    };

    window.__esportsAnalyticsTrack = (eventName, data = {}) => send(eventName, data);
    send("page_view");

    const onScroll = () => {
      const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      maxScrollDepth = Math.max(maxScrollDepth, Math.min(100, Math.round((window.scrollY / scrollable) * 100)));
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const tagged = target?.closest<HTMLElement>("[data-analytics-event]");
      if (tagged?.dataset.analyticsEvent) {
        send(tagged.dataset.analyticsEvent, { label: tagged.dataset.analyticsLabel || tagged.textContent?.trim().slice(0, 120) || null });
        return;
      }
      const link = target?.closest<HTMLAnchorElement>("a[href]");
      if (!link) return;
      const url = new URL(link.href, window.location.href);
      if (url.pathname.includes("calendar.ics")) send("calendar_export", { provider: "ics" });
      else if (url.origin !== window.location.origin) send("outbound_click", { host: url.hostname, path: url.pathname.slice(0, 160) });
    };
    const onVisibility = () => { if (document.visibilityState === "hidden") send("session_end", {}, true); };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick, true);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (lastPath === pathname) send("session_end", {}, true);
      lastPath = pathname;
      delete window.__esportsAnalyticsTrack;
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [pathname]);

  return null;
}
