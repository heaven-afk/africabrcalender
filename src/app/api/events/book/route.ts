import { NextRequest, NextResponse } from "next/server";
import { saveEvent } from "@/lib/kv";
import { CalendarEvent, EventCategory } from "@/types/event";
import { normalizeGame, normalizeRegion } from "@/lib/eventCatalog";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      category,
      orgName,
      submitterEmail,
      startDate,
      endDate,
      orgLogoUrl,
      region,
      streamLinks,
      location,
      recurrence,
      stage,
      game,
      description,
      startTime,
      endTime,
    } = body;

    if (!name?.trim() || !orgName?.trim() || !submitterEmail?.trim() || !startDate || !endDate || (recurrence && !recurrence.startTime)) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: Event Name, Org Name, Submitter Email, Start Date, and End Date.",
        },
        { status: 400 }
      );
    }

    const validCategories: EventCategory[] = ["ranking", "tournament", "scrim", "award", "podcast"];
    const eventCategory: EventCategory = validCategories.includes(category) ? category : "tournament";

    const newEvent: CalendarEvent = {
      id: `evt_book_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      category: eventCategory,
      game: normalizeGame(game),
      description: description?.trim() || null,
      startTime: startTime?.trim() || null,
      endTime: endTime?.trim() || null,
      stage: stage?.trim() || null,
      startDate,
      endDate,
      orgName: orgName.trim(),
      orgLogoUrl: orgLogoUrl?.trim() || null,
      region: normalizeRegion(region),
      streamLinks: Array.isArray(streamLinks) ? streamLinks.filter((s) => s.url?.trim()) : [],
      location: { ...(location || {}), ...(description?.trim() ? { note: description.trim() } : {}), ...(startTime?.trim() ? { startTime: startTime.trim() } : {}), ...(endTime?.trim() ? { endTime: endTime.trim() } : {}) },
      recurrence: recurrence || null,
      status: "pending",
      submitterEmail: submitterEmail.trim(),
      submittedAt: new Date().toISOString(),
      createdBy: `public:${submitterEmail.trim()}`,
      updatedAt: new Date().toISOString(),
    };

    await saveEvent(newEvent);

    return NextResponse.json(
      {
        success: true,
        message: "Your event booking has been submitted successfully! It will appear publicly once approved by an admin.",
        data: newEvent,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/events/book error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to book event." },
      { status: 500 }
    );
  }
}
