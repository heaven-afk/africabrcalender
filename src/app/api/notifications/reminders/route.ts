import { NextRequest, NextResponse } from "next/server";
import { getEventById, getEvents } from "@/lib/kv";
import { broadcastEventReminder } from "@/lib/push";
import { CalendarEvent } from "@/types/event";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST — send reminders for a specific event or check all upcoming events today
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { eventId } = body;

    if (eventId) {
      const event = await getEventById(eventId);
      if (!event) {
        return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
      }

      const result = await broadcastEventReminder(event);
      return NextResponse.json({
        success: true,
        event: event.name,
        delivered: result.delivered,
        total: result.total,
      });
    }

    // Otherwise check events starting today
    const allEvents = await getEvents();
    const todayStr = new Date().toISOString().split("T")[0];

    const todayEvents = allEvents.filter(
      (ev) => ev.startDate === todayStr || (ev.startDate <= todayStr && ev.endDate >= todayStr)
    );

    let totalDelivered = 0;
    for (const event of todayEvents) {
      const res = await broadcastEventReminder(event);
      totalDelivered += res.delivered;
    }

    return NextResponse.json({
      success: true,
      todayEventsChecked: todayEvents.length,
      delivered: totalDelivered,
    });
  } catch (err: any) {
    console.error("[Push Reminders] Error:", err);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
