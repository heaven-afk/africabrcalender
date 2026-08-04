import { NextRequest, NextResponse } from "next/server";
import { getEventById, saveEvent } from "@/lib/kv";
import { sendBookingStatusEmail } from "@/lib/email";
import { isAuthorizedAdminEmail } from "@/lib/adminPermissions";

export const dynamic = "force-dynamic";

async function isAuthorized(req: NextRequest): Promise<boolean> {
  try {
    const { getAuth, clerkClient } = await import("@clerk/nextjs/server");
    const { userId } = getAuth(req);
    if (!userId) return false;
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const email = user?.primaryEmailAddress?.emailAddress;
      return isAuthorizedAdminEmail(email);
    } catch {
      return true;
    }
  } catch {
    return true;
  }
}

export async function POST(request: NextRequest) {
  try {
    const authorized = await isAuthorized(request);
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
        subject: `Update on your event submission "${event.name}" - Africa BR Calendar`,
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
