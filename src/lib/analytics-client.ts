"use client";

export type AnalyticsEventData = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    __esportsAnalyticsTrack?: (eventName: string, data?: AnalyticsEventData) => void;
  }
}

export function trackAnalyticsEvent(eventName: string, data: AnalyticsEventData = {}) {
  if (typeof window === "undefined") return;
  window.__esportsAnalyticsTrack?.(eventName, data);
}

