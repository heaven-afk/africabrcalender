import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { CalendarEvent } from "@/types/event";
import { getOverlappingMonths } from "./utils";
import { normalizeGame, normalizeRegion } from "./eventCatalog";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseUrl.length > 0 && supabaseKey && supabaseKey.length > 0);
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl!, supabaseKey!, {
      auth: { persistSession: false },
    });
  }
  return supabaseInstance;
}

// ─── Row Mapper Utilities ───────────────────────────────────────────────────
// Maps Supabase database columns (snake_case) <-> CalendarEvent interface (camelCase)
export function mapRowToEvent(row: any): CalendarEvent {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    game: normalizeGame(row.game),
    description: row.location?.note || null,
    startTime: row.location?.startTime || row.recurrence?.startTime || null,
    endTime: row.location?.endTime || row.recurrence?.endTime || null,
    stage: row.stage || null,
    startDate: row.start_date,
    endDate: row.end_date,
    orgName: row.org_name,
    orgLogoUrl: row.org_logo_url || null,
    region: normalizeRegion(row.region),
    streamLinks: Array.isArray(row.stream_links) ? row.stream_links : [],
    location: row.location || {},
    recurrence: row.recurrence || null,
    status: row.status || "approved",
    submitterEmail: row.submitter_email || undefined,
    submittedAt: row.submitted_at || undefined,
    createdBy: row.created_by || undefined,
    updatedAt: row.updated_at || undefined,
    updatedBy: row.updated_by || undefined,
  };
}

export function mapEventToRow(evt: CalendarEvent): any {
  return {
    id: evt.id,
    name: evt.name,
    category: evt.category,
    game: normalizeGame(evt.game),
    stage: evt.stage || null,
    start_date: evt.startDate,
    end_date: evt.endDate,
    org_name: evt.orgName,
    org_logo_url: evt.orgLogoUrl || null,
    region: normalizeRegion(evt.region),
    stream_links: evt.streamLinks || [],
    location: { ...(evt.location || {}), ...(evt.description ? { note: evt.description } : {}), ...(evt.startTime ? { startTime: evt.startTime } : {}), ...(evt.endTime ? { endTime: evt.endTime } : {}) },
    recurrence: evt.recurrence || null,
    status: evt.status || "approved",
    submitter_email: evt.submitterEmail || null,
    submitted_at: evt.submittedAt || null,
    created_by: evt.createdBy || null,
    updated_at: evt.updatedAt || new Date().toISOString(),
    updated_by: evt.updatedBy || null,
  };
}

// ─── Supabase Data Operations ──────────────────────────────────────────────

/** Fetch all events or month-filtered events from Supabase */
export async function getSupabaseEvents(month?: string): Promise<CalendarEvent[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client.from("events").select("*");

    if (error) {
      console.error("Supabase getEvents error:", error);
      throw error;
    }

    let events = (data || []).map(mapRowToEvent);

    if (month) {
      events = events.filter((e) => {
        const activeMonths = getOverlappingMonths(e.startDate, e.endDate);
        return activeMonths.includes(month);
      });
    }

    return events.sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  } catch (err) {
    console.error("Error querying Supabase events:", err);
    throw err;
  }
}

/** Get a single event by ID */
export async function getSupabaseEventById(id: string): Promise<CalendarEvent | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.from("events").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return mapRowToEvent(data);
  } catch (err) {
    console.error(`Error fetching Supabase event ${id}:`, err);
    throw err;
  }
}

/** Save or update an event in Supabase */
export async function saveSupabaseEvent(event: CalendarEvent): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    const row = mapEventToRow(event);
    const { error } = await client.from("events").upsert(row, { onConflict: "id" });
    if (error) {
      console.error("Error upserting Supabase event:", error);
      throw error;
    }
  } catch (err) {
    console.error("Exception upserting Supabase event:", err);
    throw err;
  }
}

/** Delete an event from Supabase */
export async function deleteSupabaseEvent(id: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    const { error } = await client.from("events").delete().eq("id", id);
    if (error) {
      console.error(`Error deleting Supabase event ${id}:`, error);
      throw error;
    }
  } catch (err) {
    console.error(`Exception deleting Supabase event ${id}:`, err);
    throw err;
  }
}
