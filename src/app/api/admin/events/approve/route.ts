import { NextRequest, NextResponse } from "next/server";
import { getEventById, saveEvent } from "@/lib/kv";
import { sendBookingStatusEmail } from "@/lib/email";
import { sendDiscordCreateNotification } from "@/lib/discord";
import { authorizeAdminRequest } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { authorized } = await authorizeAdminRequest(request);
    if (!authorized) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: "Event ID is required" }, { status: 400 });
    }

    const event = await getEventById(id);
    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
    }

    // Update status to approved
    event.status = "approved";
    event.updatedAt = new Date().toISOString();

    await saveEvent(event);

    // Notify submitter via email if available
    if (event.submitterEmail) {
      await sendBookingStatusEmail({
        to: event.submitterEmail,
        subject: `Your event "${event.name}" on Esports Calendar was approved`,
        eventName: event.name,
        status: "approved",
      });
    }

    // Broadcast to Discord webhook
    sendDiscordCreateNotification(event).catch((err) =>
      console.error("Discord create notification error:", err)
    );

    return NextResponse.json({
      success: true,
      message: `Event "${event.name}" has been approved and published!`,
      data: event,
    });
  } catch (error: any) {
    console.error("POST /api/admin/events/approve error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to approve event" },
      { status: 500 }
    );
  }
}
