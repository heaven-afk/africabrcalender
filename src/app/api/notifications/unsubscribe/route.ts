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

export async function POST(request: NextRequest) {
  try {
    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json({ success: false, error: "Missing endpoint." }, { status: 400 });
    }

    const client = getClient();
    if (!client) {
      return NextResponse.json({ success: false, error: "Database not configured." }, { status: 503 });
    }

    const { error } = await client
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint);

    if (error) {
      console.error("[Push Unsubscribe] Delete error:", error);
      return NextResponse.json({ success: false, error: "Failed to remove subscription." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Push Unsubscribe] Error:", err);
    return NextResponse.json({ success: false, error: "Internal error." }, { status: 500 });
  }
}
