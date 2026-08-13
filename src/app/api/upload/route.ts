import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary-server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cloudinary credentials are not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment variables.",
        },
        { status: 500 }
      );
    }

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, error: "No image file provided in form data." },
          { status: 400 }
        );
      }

      // Check max file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: "Image file size exceeds limit of 10MB." },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const folder = (formData.get("folder") as string) || "africa-calendar";
      const result = await uploadToCloudinary(buffer, { folder });

      return NextResponse.json({
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      });
    }

    if (contentType.includes("application/json")) {
      const body = await request.json();
      const { image, folder } = body;

      if (!image) {
        return NextResponse.json(
          { success: false, error: "No base64 or URL image provided in JSON body." },
          { status: 400 }
        );
      }

      const result = await uploadToCloudinary(image, {
        folder: folder || "africa-calendar",
      });

      return NextResponse.json({
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      });
    }

    return NextResponse.json(
      { success: false, error: "Unsupported Content-Type header." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("POST /api/upload Cloudinary error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to upload image to Cloudinary." },
      { status: 500 }
    );
  }
}
