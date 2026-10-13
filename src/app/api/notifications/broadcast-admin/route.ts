import { NextRequest, NextResponse } from "next/server";
import { notifyAdminsOfSubmission } from "@/lib/push";
import { CalendarEvent } from "@/types/event";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const event: CalendarEvent = await request.json();

    if (!event?.id || !event?.name) {
      return NextResponse.json({ success: false, error: "Invalid event payload." }, { status: 400 });
    }

    notifyAdminsOfSubmission(event).catch((err) =>
      console.error("[Push Admin Broadcast] Error:", err)
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Push Admin Broadcast] Error:", err);
    return NextResponse.json({ success: false, error: "Internal error." }, { status: 500 });
  }
}
