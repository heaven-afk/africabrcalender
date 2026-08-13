import { NextRequest, NextResponse } from "next/server";
import { saveEvent, deleteEvent, getEventById } from "@/lib/kv";
import { CalendarEvent } from "@/types/event";
import { sendDiscordCreateNotification, sendDiscordEditNotification } from "@/lib/discord";
import { authorizeAdminRequest } from "@/lib/adminAuth";
import { getCloudinaryPublicId } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST: Create a new event
export async function POST(request: NextRequest) {
  try {
    const { userId, authorized } = await authorizeAdminRequest(request);
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin permissions required" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const logoPublicId = getCloudinaryPublicId(body.orgLogoUrl);
    const newEvent: CalendarEvent = {
      ...body,
      location: { ...(body.location || {}), logoPublicId: logoPublicId || undefined },
      id: body.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdBy: userId || "admin",
      updatedAt: new Date().toISOString(),
      updatedBy: userId || "admin",
    };

    await saveEvent(newEvent);

    // Fire Discord notification in background
    sendDiscordCreateNotification(newEvent).catch((err) =>
      console.error("Discord create webhook error:", err)
    );

    return NextResponse.json({ success: true, data: newEvent }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/events error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create event" },
      { status: 500 }
    );
  }
}

// PUT: Edit an existing event
export async function PUT(request: NextRequest) {
  try {
    const { userId, authorized } = await authorizeAdminRequest(request);
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin permissions required" },
        { status: 403 }
      );
    }

    const body: CalendarEvent = await request.json();

    if (!body.id) {
      return NextResponse.json({ success: false, error: "Event ID is required" }, { status: 400 });
    }

    const oldEvent = await getEventById(body.id);

    const logoPublicId = getCloudinaryPublicId(body.orgLogoUrl);
    const updatedEvent: CalendarEvent = {
      ...body,
      location: { ...(body.location || {}), logoPublicId: logoPublicId || undefined },
      updatedAt: new Date().toISOString(),
      updatedBy: userId || "admin",
    };

    await saveEvent(updatedEvent);

    if (oldEvent) {
      sendDiscordEditNotification(oldEvent, updatedEvent).catch((err) =>
        console.error("Discord edit webhook error:", err)
      );
    }

    return NextResponse.json({ success: true, data: updatedEvent });
  } catch (error: any) {
    console.error("PUT /api/admin/events error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update event" },
      { status: 500 }
    );
  }
}

// DELETE: Delete an event
export async function DELETE(request: NextRequest) {
  try {
    const { authorized } = await authorizeAdminRequest(request);
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin permissions required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Event ID is required" }, { status: 400 });
    }

    await deleteEvent(id);
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("DELETE /api/admin/events error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete event" },
      { status: 500 }
    );
  }
}
