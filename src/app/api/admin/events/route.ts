import { NextRequest, NextResponse } from "next/server";
import { saveEvent, deleteEvent, getEventById } from "@/lib/kv";
import { CalendarEvent } from "@/types/event";
import { sendDiscordCreateNotification, sendDiscordEditNotification } from "@/lib/discord";
import { isAuthorizedAdminEmail } from "@/lib/adminPermissions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function isAuthorized(req: NextRequest): Promise<{ userId: string | null; authorized: boolean }> {
  try {
    const { getAuth, clerkClient } = await import("@clerk/nextjs/server");
    const { userId } = getAuth(req);

    if (!userId) {
      return { userId: null, authorized: false };
    }

    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const email = user?.primaryEmailAddress?.emailAddress;

      if (!isAuthorizedAdminEmail(email)) {
        return { userId, authorized: false };
      }
    } catch {
      // If fetching user fails, fallback to user ID check
    }

    return { userId, authorized: true };
  } catch {
    // If Clerk is not set up, allow dev admin session
    return { userId: "dev-admin-user", authorized: true };
  }
}

// POST: Create a new event
export async function POST(request: NextRequest) {
  try {
    const { userId, authorized } = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin permissions required" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const newEvent: CalendarEvent = {
      ...body,
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
    const { userId, authorized } = await isAuthorized(request);
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

    const updatedEvent: CalendarEvent = {
      ...body,
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
    const { authorized } = await isAuthorized(request);
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
