import { NextRequest, NextResponse } from "next/server";
import { getEvents, isKvConfigured } from "@/lib/kv";
import { EventCategory } from "@/types/event";

// Never cache this route — always read fresh data from file/KV
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") || undefined;
    const categoryParam = searchParams.get("category");
    const regionParam = searchParams.get("region");

    let events = await getEvents(month);

    // Public feed: Only return approved events (or legacy events without status field)
    events = events.filter((e) => !e.status || e.status === "approved");

    // Filter by Category if provided
    if (categoryParam) {
      const categories = categoryParam
        .split(",")
        .map((c) => c.trim().toLowerCase()) as EventCategory[];
      events = events.filter((e) => categories.includes(e.category));
    }

    // Filter by Region if provided
    if (regionParam) {
      events = events.filter(
        (e) => e.region && e.region.toLowerCase() === regionParam.toLowerCase()
      );
    }

    return NextResponse.json({
      success: true,
      storage: isKvConfigured() ? "Upstash / Vercel KV" : "Local / Temporary Memory",
      isKvActive: isKvConfigured(),
      count: events.length,
      month: month || "all",
      data: events,
    });
  } catch (error) {
    console.error("API GET /api/events error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
