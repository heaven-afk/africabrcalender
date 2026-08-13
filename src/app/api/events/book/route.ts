import { NextRequest, NextResponse } from "next/server";
import { saveEvent } from "@/lib/kv";
import { CalendarEvent, EventCategory } from "@/types/event";
import { normalizeGame, normalizeRegion } from "@/lib/eventCatalog";
import {
  ALLOWED_MEDIA_MIME_TYPES,
  deleteCloudinaryMedia,
  isCloudinaryConfigured,
  MAX_MEDIA_FILE_SIZE,
  uploadToCloudinary,
} from "@/lib/cloudinary-server";
import { getCloudinaryPublicId } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function normalizeImageUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const url = new URL(value.trim());
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Unsupported image URL protocol.");
  }
  return url.toString();
}

export async function POST(request: NextRequest) {
  let uploadedPublicId: string | null = null;
  try {
    const contentType = request.headers.get("content-type") || "";
    let logoFile: File | null = null;
    let body: Partial<CalendarEvent>;

    if (contentType.includes("multipart/form-data")) {
      const contentLength = Number(request.headers.get("content-length") || 0);
      if (contentLength > MAX_MEDIA_FILE_SIZE + 1024 * 1024) {
        return NextResponse.json({ success: false, error: "The logo must be 5 MB or smaller." }, { status: 413 });
      }
      const formData = await request.formData();
      const payload = formData.get("payload");
      if (typeof payload !== "string") {
        return NextResponse.json({ success: false, error: "Event details are missing." }, { status: 400 });
      }
      try {
        body = JSON.parse(payload) as Partial<CalendarEvent>;
      } catch {
        return NextResponse.json({ success: false, error: "Event details are invalid." }, { status: 400 });
      }
      const suppliedLogo = formData.get("logo");
      logoFile = suppliedLogo instanceof File ? suppliedLogo : null;
    } else if (contentType.includes("application/json")) {
      body = await request.json() as Partial<CalendarEvent>;
    } else {
      return NextResponse.json({ success: false, error: "Unsupported submission format." }, { status: 415 });
    }

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
        { success: false, error: "Add the event name, organization, contact email, and schedule." },
        { status: 400 },
      );
    }

    const validCategories: EventCategory[] = ["ranking", "tournament", "scrim", "award", "podcast"];
    const eventCategory: EventCategory = category && validCategories.includes(category) ? category : "tournament";

    let finalLogoUrl: string | null;
    try {
      finalLogoUrl = normalizeImageUrl(orgLogoUrl);
    } catch {
      return NextResponse.json({ success: false, error: "Enter a valid HTTP or HTTPS image URL." }, { status: 400 });
    }
    if (logoFile) {
      if (!isCloudinaryConfigured()) {
        return NextResponse.json(
          { success: false, error: "Logo uploads are temporarily unavailable. You can submit an image URL instead." },
          { status: 503 },
        );
      }
      if (logoFile.size === 0 || logoFile.size > MAX_MEDIA_FILE_SIZE) {
        return NextResponse.json({ success: false, error: "The logo must be 5 MB or smaller." }, { status: 413 });
      }
      if (!ALLOWED_MEDIA_MIME_TYPES.has(logoFile.type)) {
        return NextResponse.json({ success: false, error: "Use a PNG, JPG, WebP, GIF, or AVIF logo." }, { status: 415 });
      }
      const uploaded = await uploadToCloudinary(Buffer.from(await logoFile.arrayBuffer()));
      uploadedPublicId = uploaded.public_id;
      finalLogoUrl = uploaded.secure_url;
    }

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
      orgLogoUrl: finalLogoUrl,
      region: normalizeRegion(region),
      streamLinks: Array.isArray(streamLinks) ? streamLinks.filter((stream) => stream.url?.trim()) : [],
      location: {
        ...(location || {}),
        ...(uploadedPublicId || getCloudinaryPublicId(finalLogoUrl)
          ? { logoPublicId: uploadedPublicId || getCloudinaryPublicId(finalLogoUrl) || undefined }
          : {}),
        ...(description?.trim() ? { note: description.trim() } : {}),
        ...(startTime?.trim() ? { startTime: startTime.trim() } : {}),
        ...(endTime?.trim() ? { endTime: endTime.trim() } : {}),
      },
      recurrence: recurrence || null,
      status: "pending",
      submitterEmail: submitterEmail.trim(),
      submittedAt: new Date().toISOString(),
      createdBy: `public:${submitterEmail.trim()}`,
      updatedAt: new Date().toISOString(),
    };

    await saveEvent(newEvent);
    uploadedPublicId = null;

    return NextResponse.json(
      {
        success: true,
        message: "Your event was submitted successfully. It will appear publicly after admin approval.",
        data: newEvent,
      },
      { status: 201 },
    );
  } catch (error) {
    if (uploadedPublicId) {
      await deleteCloudinaryMedia(uploadedPublicId).catch((cleanupError) =>
        console.error("Failed to clean up an unused public booking logo:", cleanupError),
      );
    }
    console.error("POST /api/events/book error:", error);
    return NextResponse.json({ success: false, error: "Failed to book event." }, { status: 500 });
  }
}
