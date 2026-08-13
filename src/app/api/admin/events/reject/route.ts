import { NextRequest, NextResponse } from "next/server";
import { getEventById, saveEvent } from "@/lib/kv";
import { sendBookingStatusEmail } from "@/lib/email";
import { authorizeAdminRequest } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { authorized } = await authorizeAdminRequest(request);
    if (!authorized) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id, reason } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: "Event ID is required" }, { status: 400 });
    }

    const event = await getEventById(id);
    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
    }

    // Update status to rejected
    event.status = "rejected";
    event.updatedAt = new Date().toISOString();

    await saveEvent(event);

    // Notify submitter via email if available
    if (event.submitterEmail) {
      await sendBookingStatusEmail({
        to: event.submitterEmail,
        subject: `Update on your event submission "${event.name}" — Esports Calendar`,
        eventName: event.name,
        status: "rejected",
        reason: reason || "Does not meet calendar publishing guidelines.",
      });
    }

    return NextResponse.json({
      success: true,
      message: `Event "${event.name}" was rejected.`,
      data: event,
    });
  } catch (error: any) {
    console.error("POST /api/admin/events/reject error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to reject event" },
      { status: 500 }
    );
  }
}
