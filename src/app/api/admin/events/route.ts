import "@/lib/clerkSanitize";
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { saveEvent, deleteEvent, getEventById } from "@/lib/kv";
import { CalendarEvent } from "@/types/event";
import { sendDiscordCreateNotification, sendDiscordEditNotification } from "@/lib/discord";

export const dynamic = "force-dynamic";
export const revalidate = 0;


function isAuthorized(req: NextRequest): { userId: string | null } {
  try {
    const { userId } = getAuth(req);
    return { userId };
  } catch {
    // If Clerk is not set up in environment, fallback to dev admin mode
    return { userId: "dev-admin-user" };
  }
}

// POST: Create a new event
export async function POST(request: NextRequest) {
  try {
    const { userId } = isAuthorized(request);
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
  } catch (error) {
    console.error("POST /api/admin/events error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create event" },
      { status: 500 }
    );
  }
}

// PUT: Edit an existing event
export async function PUT(request: NextRequest) {
  try {
    const { userId } = isAuthorized(request);
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
  } catch (error) {
    console.error("PUT /api/admin/events error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update event" },
      { status: 500 }
    );
  }
}

// DELETE: Delete an event
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Event ID is required" }, { status: 400 });
    }

    await deleteEvent(id);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("DELETE /api/admin/events error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
