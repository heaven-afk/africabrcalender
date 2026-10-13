/**
 * Server-side Web Push notification helpers for Esports Calendar
 */
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import { CalendarEvent } from "@/types/event";

// ─── VAPID Configuration ─────────────────────────────────────────────────────

function getVapidConfig() {
  const publicKey =
    process.env.VAPID_PUBLIC_KEY ||
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    "BEmDROyPdokhCQ_7bMM-Z8CLlefcwJwNRQmkhxQpX7OvR8KqshQ97aOnj69GQKScq58nziLj8yKzRtYRMCfxpgw";
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:ogadizion01@gmail.com";
  return { publicKey, privateKey, subject };
}

function isVapidConfigured(): boolean {
  const { publicKey, privateKey } = getVapidConfig();
  return Boolean(publicKey && privateKey);
}

// ─── Supabase client (service role) ─────────────────────────────────────────

function getPushClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface PushSubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
  categories: string[];
  event_ids?: string[];
  is_admin: boolean;
}

// ─── Broadcast helpers ───────────────────────────────────────────────────────

async function sendToSubscription(
  sub: PushSubscriptionRow,
  payload: object
): Promise<void> {
  const { publicKey, privateKey, subject } = getVapidConfig();
  webpush.setVapidDetails(subject, publicKey!, privateKey!);

  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload)
    );
  } catch (err: any) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      const client = getPushClient();
      if (client) {
        await client.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      }
    }
    throw err;
  }
}

/**
 * Broadcast a push notification for a new/approved event to all matching
 * public subscribers (filtered by their category preferences).
 */
export async function broadcastEventNotification(event: CalendarEvent): Promise<void> {
  if (!isVapidConfigured()) {
    console.log("[Push] VAPID not configured. Skipping broadcast.");
    return;
  }

  const client = getPushClient();
  if (!client) {
    console.log("[Push] Supabase not configured. Skipping broadcast.");
    return;
  }

  const { data: subscriptions, error } = await client
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, categories, is_admin")
    .eq("is_admin", false);

  if (error) {
    console.error("[Push] Failed to fetch subscriptions:", error);
    return;
  }
  if (!subscriptions || subscriptions.length === 0) return;

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://esportscalendar.org").replace(/\/$/, "");
  const eventUrl = `${siteUrl}/?event=${encodeURIComponent(event.id)}&date=${encodeURIComponent(event.startDate)}`;

  const payload = {
    title: event.name,
    body: [event.orgName, event.game].filter(Boolean).join(" · "),
    url: eventUrl,
    icon: "/favicon.png",
  };

  const results = await Promise.allSettled(
    subscriptions
      .filter((sub: PushSubscriptionRow) => {
        // Empty categories = subscribed to all; otherwise must include this event's category
        return sub.categories.length === 0 || sub.categories.includes(event.category);
      })
      .map((sub: PushSubscriptionRow) => sendToSubscription(sub, payload))
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  console.log(`[Push] Event broadcast: ${succeeded}/${results.length} delivered for "${event.name}"`);
}

/**
 * Notify admin subscribers that a new event has been submitted for review.
 */
export async function notifyAdminsOfSubmission(event: CalendarEvent): Promise<void> {
  if (!isVapidConfigured()) {
    console.log("[Push] VAPID not configured. Skipping admin notification.");
    return;
  }

  const client = getPushClient();
  if (!client) {
    console.log("[Push] Supabase not configured. Skipping admin notification.");
    return;
  }

  const { data: subscriptions, error } = await client
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, categories, is_admin")
    .eq("is_admin", true);

  if (error) {
    console.error("[Push] Failed to fetch admin subscriptions:", error);
    return;
  }
  if (!subscriptions || subscriptions.length === 0) return;

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://esportscalendar.org").replace(/\/$/, "");

  const payload = {
    title: "New event submission",
    body: `${event.name} by ${event.orgName} — needs review`,
    url: `${siteUrl}/admin`,
    icon: "/favicon.png",
  };

  const results = await Promise.allSettled(
    subscriptions.map((sub: PushSubscriptionRow) => sendToSubscription(sub, payload))
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  console.log(`[Push] Admin notification: ${succeeded}/${results.length} admins notified for "${event.name}"`);
}

/**
 * Send an event reminder push notification to subscribers who explicitly
 * set a reminder for this event (or have it in their event_ids).
 */
export async function broadcastEventReminder(event: CalendarEvent): Promise<{ delivered: number; total: number }> {
  if (!isVapidConfigured()) {
    console.log("[Push] VAPID not configured. Skipping reminder.");
    return { delivered: 0, total: 0 };
  }

  const client = getPushClient();
  if (!client) {
    console.log("[Push] Supabase not configured. Skipping reminder.");
    return { delivered: 0, total: 0 };
  }

  // Fetch subscriptions that have this event in their event_ids
  const { data: subscriptions, error } = await client
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, categories, event_ids, is_admin")
    .contains("event_ids", [event.id]);

  if (error) {
    console.error("[Push] Failed to query reminder subscriptions:", error);
    return { delivered: 0, total: 0 };
  }
  if (!subscriptions || subscriptions.length === 0) {
    return { delivered: 0, total: 0 };
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://esportscalendar.org").replace(/\/$/, "");
  const eventUrl = `${siteUrl}/?event=${encodeURIComponent(event.id)}&date=${encodeURIComponent(event.startDate)}`;
  const timeStr = event.startTime ? `Starts at ${event.startTime}` : "Starting today";

  const payload = {
    title: `Starting soon: ${event.name}`,
    body: [event.orgName, timeStr, event.game].filter(Boolean).join(" · "),
    url: eventUrl,
    icon: "/favicon.png",
  };

  const results = await Promise.allSettled(
    subscriptions.map((sub: PushSubscriptionRow) => sendToSubscription(sub, payload))
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  console.log(`[Push] Reminder broadcast: ${succeeded}/${results.length} delivered for "${event.name}"`);
  return { delivered: succeeded, total: results.length };
}
