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

// POST — save or update a subscription, PATCH — update categories only
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, keys, categories = [], isAdmin = false } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { success: false, error: "Missing subscription fields." },
        { status: 400 }
      );
    }

    const client = getClient();
    if (!client) {
      return NextResponse.json(
        { success: false, error: "Database not configured." },
        { status: 503 }
      );
    }

    const { error } = await client.from("push_subscriptions").upsert(
      {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        categories,
        is_admin: isAdmin,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    );

    if (error) {
      console.error("[Push Subscribe] Upsert error:", error);
      return NextResponse.json({ success: false, error: "Failed to save subscription." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Push Subscribe] Error:", err);
    return NextResponse.json({ success: false, error: "Internal error." }, { status: 500 });
  }
}

// PATCH — update category preferences for an existing subscription
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, categories } = body;

    if (!endpoint || !Array.isArray(categories)) {
      return NextResponse.json(
        { success: false, error: "Missing endpoint or categories." },
        { status: 400 }
      );
    }

    const client = getClient();
    if (!client) {
      return NextResponse.json({ success: false, error: "Database not configured." }, { status: 503 });
    }

    const { error } = await client
      .from("push_subscriptions")
      .update({ categories, last_seen_at: new Date().toISOString() })
      .eq("endpoint", endpoint);

    if (error) {
      console.error("[Push Subscribe PATCH] Update error:", error);
      return NextResponse.json({ success: false, error: "Failed to update preferences." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Push Subscribe PATCH] Error:", err);
    return NextResponse.json({ success: false, error: "Internal error." }, { status: 500 });
  }
}
