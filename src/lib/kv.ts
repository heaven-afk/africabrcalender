import { kv } from "@vercel/kv";
import { CalendarEvent } from "@/types/event";
import { getOverlappingMonths } from "./utils";
import {
  isSupabaseConfigured,
  getSupabaseEvents,
  getSupabaseEventById,
  saveSupabaseEvent,
  deleteSupabaseEvent,
} from "./supabase";

// Re-export pure utilities so existing imports from @/lib/kv still work
export { getOverlappingMonths, isScrimActiveOnDate, getOrgInitials } from "./utils";
export { isSupabaseConfigured };

// ─── KV Configuration ───────────────────────────────────────────────────────
export function isKvConfigured(): boolean {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return Boolean(url && url.length > 0 && token && token.length > 0);
}

const kvClient = kv as any;

// ─── Server-only file store (lazy-loaded only in API routes) ───────────────
import { readJsonStore, writeJsonStore } from "./fileStore";

/**
 * Fetch all events or events active within a given month (YYYY-MM)
 * Server-side only (API routes)
 */
export async function getEvents(month?: string): Promise<CalendarEvent[]> {
  try {
    if (isSupabaseConfigured()) return await getSupabaseEvents(month);

    if (isKvConfigured()) {
      let eventIds = (await kvClient.smembers("events:all")) as string[];
      
      // Auto-seed KV with pre-existing events from data/events.json if KV is empty
      if (!eventIds || eventIds.length === 0) {
        console.log("KV database is empty. Auto-migrating pre-existing events from data/events.json...");
        const store = readJsonStore();
        for (const evt of store.values()) {
          const months = getOverlappingMonths(evt.startDate, evt.endDate);
          await kvClient.set(`event:${evt.id}`, evt);
          await kvClient.sadd("events:all", evt.id);
          for (const m of months) {
            await kvClient.sadd(`events:month:${m}`, evt.id);
          }
        }
        eventIds = (await kvClient.smembers("events:all")) as string[];
      }

      if (!eventIds || eventIds.length === 0) return [];

      if (month) {
        const monthIds = (await kvClient.smembers(`events:month:${month}`)) as string[];
        if (!monthIds || monthIds.length === 0) return [];
        const keys = monthIds.map((id: string) => `event:${id}`);
        const events = (await kvClient.mget(...keys)) as CalendarEvent[];
        return (events.filter(Boolean) as CalendarEvent[]).sort(
          (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
      } else {
        const keys = eventIds.map((id: string) => `event:${id}`);
        const events = (await kvClient.mget(...keys)) as CalendarEvent[];
        return (events.filter(Boolean) as CalendarEvent[]).sort(
          (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
      }
    } else {
      const store = readJsonStore();
      const allEvents = Array.from(store.values());

      if (!month) {
        return allEvents.sort(
          (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
      }

      return allEvents
        .filter((event) => {
          const activeMonths = getOverlappingMonths(event.startDate, event.endDate);
          return activeMonths.includes(month);
        })
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
}

/**
 * Get a single event by ID — server-side only
 */
export async function getEventById(id: string): Promise<CalendarEvent | null> {
  try {
    if (isSupabaseConfigured()) {
      return await getSupabaseEventById(id);
    }

    if (isKvConfigured()) {
      const event = (await kvClient.get(`event:${id}`)) as CalendarEvent | null;
      return event;
    } else {
      const store = readJsonStore();
      return store.get(id) || null;
    }
  } catch (error) {
    console.error(`Error fetching event ${id}:`, error);
    throw error;
  }
}

/**
 * Save or update an event — server-side only
 */
export async function saveEvent(event: CalendarEvent): Promise<void> {
  if (isSupabaseConfigured()) {
    await saveSupabaseEvent(event);
    return;
  }

  const months = getOverlappingMonths(event.startDate, event.endDate);

  if (isKvConfigured()) {
    await kvClient.set(`event:${event.id}`, event);
    await kvClient.sadd("events:all", event.id);
    for (const m of months) {
      await kvClient.sadd(`events:month:${m}`, event.id);
    }
  } else {
    const store = readJsonStore();
    store.set(event.id, event);
    writeJsonStore(store);
  }
}

/**
 * Delete an event — server-side only
 */
export async function deleteEvent(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    await deleteSupabaseEvent(id);
    return;
  }

  if (isKvConfigured()) {
    const existing = await getEventById(id);
    if (existing) {
      const months = getOverlappingMonths(existing.startDate, existing.endDate);
      await kvClient.del(`event:${id}`);
      await kvClient.srem("events:all", id);
      for (const m of months) {
        await kvClient.srem(`events:month:${m}`, id);
      }
    }
  } else {
    const store = readJsonStore();
    store.delete(id);
    writeJsonStore(store);
  }
}
