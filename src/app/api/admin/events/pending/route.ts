import { NextRequest, NextResponse } from "next/server";
import { getEvents } from "@/lib/kv";
import { authorizeAdminRequest } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { authorized } = await authorizeAdminRequest(request);
    if (!authorized) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const allEvents = await getEvents();
    const pending = allEvents.filter((e) => e.status === "pending");

    return NextResponse.json({
      success: true,
      count: pending.length,
      data: pending,
    });
  } catch (error: any) {
    console.error("GET /api/admin/events/pending error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch pending events" },
      { status: 500 }
    );
  }
}
