import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// POST — toggle/add/remove an event ID from a subscriber's event_ids array
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, keys, eventId, action = "toggle" } = body;

    if (!endpoint || !eventId) {
      return NextResponse.json(
        { success: false, error: "Missing endpoint or eventId" },
        { status: 400 }
      );
    }

    const client = getClient();
    if (!client) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 503 }
      );
    }

    // 1. Fetch current subscription
    const { data: existing, error: fetchErr } = await client
      .from("push_subscriptions")
      .select("endpoint, event_ids")
      .eq("endpoint", endpoint)
      .maybeSingle();

    if (fetchErr) {
      console.warn("[Push Remind] Error checking subscription:", fetchErr.message);
      // Graceful fallback if event_ids column is not yet migrated
      return NextResponse.json({
        success: true,
        isReminded: action === "add" || action === "toggle",
        warning: "Database column pending migration",
      });
    }

    let currentEventIds: string[] = Array.isArray(existing?.event_ids) ? existing.event_ids : [];
    let isReminded = currentEventIds.includes(eventId);

    if (action === "toggle") {
      if (isReminded) {
        currentEventIds = currentEventIds.filter((id) => id !== eventId);
        isReminded = false;
      } else {
        currentEventIds = [...currentEventIds, eventId];
        isReminded = true;
      }
    } else if (action === "add") {
      if (!isReminded) currentEventIds = [...currentEventIds, eventId];
      isReminded = true;
    } else if (action === "remove") {
      currentEventIds = currentEventIds.filter((id) => id !== eventId);
      isReminded = false;
    }

    // 2. If subscription doesn't exist yet, create it with keys if provided
    if (!existing) {
      if (!keys?.p256dh || !keys?.auth) {
        return NextResponse.json(
          { success: false, error: "Subscription keys required for new subscriber" },
          { status: 400 }
        );
      }
      const { error: insertErr } = await client.from("push_subscriptions").upsert(
        {
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          categories: [],
          event_ids: currentEventIds,
          is_admin: false,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" }
      );
      if (insertErr) {
        console.warn("[Push Remind] Insert error:", insertErr.message);
      }
    } else {
      // 3. Update event_ids on existing subscription
      const { error: updateErr } = await client
        .from("push_subscriptions")
        .update({
          event_ids: currentEventIds,
          last_seen_at: new Date().toISOString(),
        })
        .eq("endpoint", endpoint);

      if (updateErr) {
        console.warn("[Push Remind] Update error:", updateErr.message);
      }
    }

    return NextResponse.json({ success: true, isReminded });
  } catch (err: any) {
    console.error("[Push Remind] Unexpected error:", err);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
