import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/adminAuth";
import {
  ALLOWED_MEDIA_MIME_TYPES,
  deleteCloudinaryMedia,
  isCloudinaryConfigured,
  listCloudinaryMedia,
  MAX_MEDIA_FILE_SIZE,
  uploadToCloudinary,
} from "@/lib/cloudinary-server";
import { getCloudinaryPublicId } from "@/lib/cloudinary";
import { getEvents } from "@/lib/kv";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Media request failed.";
}

async function requireAdmin(request: NextRequest) {
  const authorization = await authorizeAdminRequest(request);
  if (!authorization.authorized) {
    return NextResponse.json(
      { success: false, error: "Administrator access is required." },
      { status: 403 },
    );
  }
  return null;
}

export async function GET(request: NextRequest) {
  const forbidden = await requireAdmin(request);
  if (forbidden) return forbidden;

  try {
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { success: false, error: "Cloudinary is not configured for this deployment." },
        { status: 503 },
      );
    }

    const cursor = new URL(request.url).searchParams.get("cursor") || undefined;
    if (cursor && cursor.length > 500) {
      return NextResponse.json({ success: false, error: "Invalid media cursor." }, { status: 400 });
    }

    const result = await listCloudinaryMedia(cursor);
    return NextResponse.json({ success: true, data: result.assets, nextCursor: result.nextCursor });
  } catch (error) {
    console.error("GET /api/admin/media error:", error);
    return NextResponse.json({ success: false, error: "Unable to load the media library." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const forbidden = await requireAdmin(request);
  if (forbidden) return forbidden;

  try {
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { success: false, error: "Cloudinary is not configured for this deployment." },
        { status: 503 },
      );
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ success: false, error: "Upload an image file." }, { status: 415 });
    }

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_MEDIA_FILE_SIZE + 512 * 1024) {
      return NextResponse.json({ success: false, error: "Images must be 5 MB or smaller." }, { status: 413 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "Choose an image to upload." }, { status: 400 });
    }
    if (file.size === 0 || file.size > MAX_MEDIA_FILE_SIZE) {
      return NextResponse.json({ success: false, error: "Images must be 5 MB or smaller." }, { status: 413 });
    }
    if (!ALLOWED_MEDIA_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: false, error: "Use a PNG, JPG, WebP, GIF, or AVIF image." },
        { status: 415 },
      );
    }

    const result = await uploadToCloudinary(Buffer.from(await file.arrayBuffer()));
    return NextResponse.json(
      {
        success: true,
        data: {
          publicId: result.public_id,
          url: result.secure_url,
          width: result.width ?? null,
          height: result.height ?? null,
          bytes: result.bytes ?? null,
          format: result.format ?? null,
          createdAt: result.created_at ?? new Date().toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/admin/media error:", errorMessage(error));
    return NextResponse.json({ success: false, error: "The image could not be uploaded." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const forbidden = await requireAdmin(request);
  if (forbidden) return forbidden;

  try {
    const body: unknown = await request.json();
    const publicId = typeof body === "object" && body !== null && "publicId" in body
      ? String(body.publicId)
      : "";
    if (!publicId.startsWith("africa-calendar/")) {
      return NextResponse.json({ success: false, error: "Invalid media asset." }, { status: 400 });
    }

    const events = await getEvents();
    const usedBy = events
      .filter((event) => (event.location?.logoPublicId || getCloudinaryPublicId(event.orgLogoUrl)) === publicId)
      .map((event) => event.name);
    if (usedBy.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `This logo is still used by ${usedBy.slice(0, 3).join(", ")}${usedBy.length > 3 ? " and other events" : ""}.`,
        },
        { status: 409 },
      );
    }

    await deleteCloudinaryMedia(publicId);
    return NextResponse.json({ success: true, publicId });
  } catch (error) {
    console.error("DELETE /api/admin/media error:", errorMessage(error));
    return NextResponse.json({ success: false, error: "The media asset could not be deleted." }, { status: 500 });
  }
}
