import "server-only";

import { NextRequest } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { AnalyticsBreakdownRow, AnalyticsMetric, AnalyticsPoint, AnalyticsReport } from "@/types/analytics";

type SessionRow = {
  session_id: string; visitor_id: string; started_at: string; last_seen_at: string;
  entry_path: string; exit_path: string; referrer: string | null; referrer_host: string | null;
  source: string; medium: string | null; campaign: string | null; country_code: string;
  region: string | null; city: string | null; device_type: string; browser: string; os: string;
  pageviews: number; duration_seconds: number; max_scroll_depth: number; is_bounce: boolean;
};

type EventRow = {
  session_id: string; visitor_id: string; event_name: string; path: string;
  event_data: Record<string, unknown> | null; occurred_at: string;
};

const BOT_PATTERN = /bot|crawler|spider|slurp|preview|facebookexternalhit|whatsapp|discordbot|telegrambot/i;
const ALLOWED_EVENTS = new Set([
  "page_view", "session_end", "event_view", "view_change", "export_open", "submission_open",
  "public_submission", "calendar_provider_selected", "calendar_subscription_open", "calendar_download",
  "calendar_export", "outbound_click",
]);

function clean(value: unknown, max = 240) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function parseAgent(userAgent: string) {
  const device = /tablet|ipad/i.test(userAgent) ? "Tablet" : /mobile|android|iphone/i.test(userAgent) ? "Mobile" : "Desktop";
  const browser = /edg\//i.test(userAgent) ? "Edge" : /opr\//i.test(userAgent) ? "Opera" : /firefox\//i.test(userAgent) ? "Firefox" : /chrome\//i.test(userAgent) ? "Chrome" : /safari\//i.test(userAgent) ? "Safari" : "Other";
  const os = /windows/i.test(userAgent) ? "Windows" : /iphone|ipad|ios/i.test(userAgent) ? "iOS" : /android/i.test(userAgent) ? "Android" : /mac os|macintosh/i.test(userAgent) ? "macOS" : /linux/i.test(userAgent) ? "Linux" : "Other";
  return { device, browser, os };
}

function trafficSource(referrer: string, utmSource: string, utmMedium: string) {
  if (utmSource) return { source: utmSource.toLowerCase(), medium: utmMedium || "campaign" };
  if (!referrer) return { source: "Direct", medium: "none" };
  let host = "";
  try { host = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase(); } catch { return { source: "Referral", medium: "referral" }; }
  if (/google\.|bing\.|yahoo\.|duckduckgo\.|yandex\./.test(host)) return { source: host.split(".")[0], medium: "organic" };
  if (/discord|facebook|instagram|twitter|x\.com|tiktok|youtube|reddit|linkedin|t\.me/.test(host)) return { source: host, medium: "social" };
  return { source: host || "Referral", medium: "referral" };
}

export async function collectAnalytics(request: NextRequest, raw: unknown) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Analytics storage is not configured.");
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const userAgent = clean(request.headers.get("user-agent"), 500);
  if (!userAgent || BOT_PATTERN.test(userAgent)) return { ignored: true };

  const sessionId = clean(body.sessionId, 100);
  const visitorId = clean(body.visitorId, 100);
  const eventName = clean(body.eventName, 64).toLowerCase();
  if (!sessionId || !visitorId || !ALLOWED_EVENTS.has(eventName)) throw new Error("Invalid analytics event.");

  const path = clean(body.path, 300) || "/";
  const referrer = clean(body.referrer, 500);
  const data = body.data && typeof body.data === "object" ? body.data as Record<string, unknown> : {};
  const occurredAt = clean(body.occurredAt, 40) || new Date().toISOString();
  const duration = Math.min(86400, Math.max(0, Number(body.durationSeconds) || 0));
  const scrollDepth = Math.min(100, Math.max(0, Number(body.scrollDepth) || 0));
  const utmSource = clean(data.utmSource, 100);
  const utmMedium = clean(data.utmMedium, 100);
  const campaign = clean(data.utmCampaign, 140) || null;
  const source = trafficSource(referrer, utmSource, utmMedium);
  const agent = parseAgent(userAgent);
  const country = clean(request.headers.get("x-vercel-ip-country"), 8).toUpperCase() || "Unknown";
  const region = clean(request.headers.get("x-vercel-ip-country-region"), 80) || null;
  const cityHeader = clean(request.headers.get("x-vercel-ip-city"), 120);
  let city = cityHeader || null;
  try { city = cityHeader ? decodeURIComponent(cityHeader) : null; } catch { /* Keep the raw header. */ }
  let referrerHost: string | null = null;
  try { referrerHost = referrer ? new URL(referrer).hostname.replace(/^www\./, "") : null; } catch { referrerHost = null; }

  const { data: existing, error: existingError } = await client.from("analytics_sessions").select("*").eq("session_id", sessionId).maybeSingle();
  if (existingError) throw existingError;
  const current = existing as SessionRow | null;
  const pageviews = (current?.pageviews || 0) + (eventName === "page_view" ? 1 : 0);
  const sessionRow: Record<string, unknown> = current ? {
    last_seen_at: occurredAt,
    exit_path: path,
    pageviews,
    duration_seconds: Math.max(current.duration_seconds || 0, duration),
    max_scroll_depth: Math.max(current.max_scroll_depth || 0, scrollDepth),
    is_bounce: pageviews <= 1 && Math.max(current.duration_seconds || 0, duration) < 10,
  } : {
    session_id: sessionId, visitor_id: visitorId, started_at: occurredAt, last_seen_at: occurredAt,
    entry_path: path, exit_path: path, referrer: referrer || null, referrer_host: referrerHost,
    source: source.source, medium: source.medium, campaign, country_code: country, region, city,
    device_type: agent.device, browser: agent.browser, os: agent.os, pageviews,
    duration_seconds: duration, max_scroll_depth: scrollDepth, is_bounce: pageviews <= 1 && duration < 10,
  };
  const { error: sessionError } = current
    ? await client.from("analytics_sessions").update(sessionRow).eq("session_id", sessionId)
    : await client.from("analytics_sessions").insert(sessionRow);
  if (sessionError) throw sessionError;

  const safeData = Object.fromEntries(Object.entries(data).slice(0, 20).map(([key, value]) => [clean(key, 50), typeof value === "string" ? clean(value, 300) : value]));
  const { error: eventError } = await client.from("analytics_events").insert({
    session_id: sessionId, visitor_id: visitorId, event_name: eventName, path,
    referrer_path: clean(body.referrerPath, 300) || null, event_data: safeData, occurred_at: occurredAt,
  });
  if (eventError) throw eventError;
  return { ignored: false };
}

async function fetchAll(table: string, startColumn: string, start: string, end: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Analytics storage is not configured.");
  const rows: unknown[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.from(table).select("*").gte(startColumn, start).lte(startColumn, end).range(offset, offset + 999);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

function metric(value: number, previous: number): AnalyticsMetric {
  return { value, previous, change: previous === 0 ? (value === 0 ? 0 : null) : ((value - previous) / previous) * 100 };
}

function unique(rows: SessionRow[]) { return new Set(rows.map((row) => row.visitor_id)).size; }
function average(rows: SessionRow[], key: "duration_seconds") { return rows.length ? rows.reduce((sum, row) => sum + Number(row[key] || 0), 0) / rows.length : 0; }
function bounce(rows: SessionRow[]) { return rows.length ? (rows.filter((row) => row.is_bounce).length / rows.length) * 100 : 0; }

function breakdown<T>(rows: T[], keyOf: (row: T) => string, visitorOf: (row: T) => string, limit = 10): AnalyticsBreakdownRow[] {
  const groups = new Map<string, { value: number; visitors: Set<string> }>();
  rows.forEach((row) => {
    const key = keyOf(row) || "Unknown";
    const group = groups.get(key) || { value: 0, visitors: new Set<string>() };
    group.value += 1; group.visitors.add(visitorOf(row)); groups.set(key, group);
  });
  const total = rows.length || 1;
  return Array.from(groups.entries()).map(([key, group]) => ({ key, label: key, value: group.value, visitors: group.visitors.size, percentage: (group.value / total) * 100 })).sort((a, b) => b.value - a.value).slice(0, limit);
}

function applyFilters(rows: SessionRow[], filters: Record<string, string>) {
  return rows.filter((row) => (!filters.country || row.country_code === filters.country) && (!filters.source || row.source === filters.source) && (!filters.device || row.device_type === filters.device));
}

export async function buildAnalyticsReport(start: Date, end: Date, filters: Record<string, string>): Promise<AnalyticsReport> {
  const durationMs = end.getTime() - start.getTime();
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - durationMs);
  const [currentSessionsRaw, currentEventsRaw, previousSessionsRaw, previousEventsRaw] = await Promise.all([
    fetchAll("analytics_sessions", "started_at", start.toISOString(), end.toISOString()),
    fetchAll("analytics_events", "occurred_at", start.toISOString(), end.toISOString()),
    fetchAll("analytics_sessions", "started_at", previousStart.toISOString(), previousEnd.toISOString()),
    fetchAll("analytics_events", "occurred_at", previousStart.toISOString(), previousEnd.toISOString()),
  ]);
  const allCurrentSessions = currentSessionsRaw as SessionRow[];
  const currentSessions = applyFilters(allCurrentSessions, filters);
  const previousSessions = applyFilters(previousSessionsRaw as SessionRow[], filters);
  const currentIds = new Set(currentSessions.map((row) => row.session_id));
  const previousIds = new Set(previousSessions.map((row) => row.session_id));
  const currentEvents = (currentEventsRaw as EventRow[]).filter((row) => currentIds.has(row.session_id));
  const previousEvents = (previousEventsRaw as EventRow[]).filter((row) => previousIds.has(row.session_id));
  const pageviews = currentEvents.filter((row) => row.event_name === "page_view");
  const previousPageviews = previousEvents.filter((row) => row.event_name === "page_view");
  const eventViews = currentEvents.filter((row) => row.event_name === "event_view");
  const previousEventViews = previousEvents.filter((row) => row.event_name === "event_view");

  const points = new Map<string, AnalyticsPoint>();
  const cursor = new Date(start); cursor.setUTCHours(0, 0, 0, 0);
  while (cursor <= end) { const date = cursor.toISOString().slice(0, 10); points.set(date, { date, visitors: 0, sessions: 0, pageviews: 0 }); cursor.setUTCDate(cursor.getUTCDate() + 1); }
  currentSessions.forEach((row) => { const point = points.get(row.started_at.slice(0, 10)); if (point) point.sessions += 1; });
  pageviews.forEach((row) => { const point = points.get(row.occurred_at.slice(0, 10)); if (point) point.pageviews += 1; });
  const dailyVisitors = new Map<string, Set<string>>();
  currentSessions.forEach((row) => { const date = row.started_at.slice(0, 10); const set = dailyVisitors.get(date) || new Set<string>(); set.add(row.visitor_id); dailyVisitors.set(date, set); });
  dailyVisitors.forEach((set, date) => { const point = points.get(date); if (point) point.visitors = set.size; });

  const engagedIds = new Set(currentSessions.filter((row) => row.pageviews > 1 || row.duration_seconds >= 10 || row.max_scroll_depth >= 50).map((row) => row.session_id));
  const eventViewIds = new Set(eventViews.map((row) => row.session_id));
  const conversionIds = new Set(currentEvents.filter((row) => ["calendar_export", "outbound_click", "public_submission"].includes(row.event_name)).map((row) => row.session_id));
  const funnelBase = currentSessions.length || 1;
  const actions = currentEvents.filter((row) => !["page_view", "session_end"].includes(row.event_name));
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));

  return {
    range: { start: start.toISOString(), end: end.toISOString(), days }, generatedAt: new Date().toISOString(),
    totals: {
      visitors: metric(unique(currentSessions), unique(previousSessions)), sessions: metric(currentSessions.length, previousSessions.length),
      pageviews: metric(pageviews.length, previousPageviews.length), bounceRate: metric(bounce(currentSessions), bounce(previousSessions)),
      avgDuration: metric(average(currentSessions, "duration_seconds"), average(previousSessions, "duration_seconds")),
      eventViews: metric(eventViews.length, previousEventViews.length),
    },
    timeseries: Array.from(points.values()),
    sources: breakdown(currentSessions, (row) => row.source, (row) => row.visitor_id),
    countries: breakdown(currentSessions, (row) => row.country_code, (row) => row.visitor_id, 15),
    devices: breakdown(currentSessions, (row) => row.device_type, (row) => row.visitor_id),
    browsers: breakdown(currentSessions, (row) => row.browser, (row) => row.visitor_id),
    pages: breakdown(pageviews, (row) => row.path, (row) => row.visitor_id, 15),
    entryPages: breakdown(currentSessions, (row) => row.entry_path, (row) => row.visitor_id, 12),
    exitPages: breakdown(currentSessions, (row) => row.exit_path, (row) => row.visitor_id, 12),
    actions: breakdown(actions, (row) => row.event_name.replaceAll("_", " "), (row) => row.visitor_id, 12),
    funnel: [
      { label: "Sessions", value: currentSessions.length, percentage: 100 },
      { label: "Engaged", value: engagedIds.size, percentage: (engagedIds.size / funnelBase) * 100 },
      { label: "Viewed an event", value: eventViewIds.size, percentage: (eventViewIds.size / funnelBase) * 100 },
      { label: "Took action", value: conversionIds.size, percentage: (conversionIds.size / funnelBase) * 100 },
    ],
    filters: {
      countries: Array.from(new Set(allCurrentSessions.map((row) => row.country_code))).sort(),
      sources: Array.from(new Set(allCurrentSessions.map((row) => row.source))).sort(),
      devices: Array.from(new Set(allCurrentSessions.map((row) => row.device_type))).sort(),
    },
  };
}
