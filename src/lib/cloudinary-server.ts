import "server-only";

import { v2 as cloudinary } from "cloudinary";
import { MediaAsset } from "@/types/media";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

/**
 * Returns whether Cloudinary environment variables are configured.
 */
export function isCloudinaryConfigured(): boolean {
  return Boolean(cloudName && apiKey && apiSecret);
}

export interface CloudinaryUploadResult {
  url: string;
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  created_at?: string;
}

export const CLOUDINARY_MEDIA_FOLDER = "africa-calendar/logos";
export const CLOUDINARY_MEDIA_PREFIX = "africa-calendar/";
export const MAX_MEDIA_FILE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_MEDIA_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

/**
 * Uploads a file (Base64 data string or Buffer) to Cloudinary.
 */
export async function uploadToCloudinary(
  file: Buffer,
  options: { publicId?: string } = {}
): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Cloudinary credentials are not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment."
    );
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: CLOUDINARY_MEDIA_FOLDER,
        public_id: options.publicId,
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "gif", "avif"],
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Failed to upload image stream to Cloudinary"));
        }
        resolve({
          url: result.url,
          secure_url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          created_at: result.created_at,
        });
      }
    );

    uploadStream.end(file);
  });
}

function toMediaAsset(resource: {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
  created_at?: string;
}): MediaAsset {
  return {
    publicId: resource.public_id,
    url: resource.secure_url,
    width: resource.width ?? null,
    height: resource.height ?? null,
    bytes: resource.bytes ?? null,
    format: resource.format ?? null,
    createdAt: resource.created_at ?? null,
  };
}

export async function listCloudinaryMedia(nextCursor?: string): Promise<{
  assets: MediaAsset[];
  nextCursor: string | null;
}> {
  if (!isCloudinaryConfigured()) throw new Error("Cloudinary is not configured.");

  const result = await cloudinary.api.resources({
    type: "upload",
    resource_type: "image",
    prefix: CLOUDINARY_MEDIA_PREFIX,
    max_results: 50,
    next_cursor: nextCursor,
    direction: "desc",
  });

  return {
    assets: (result.resources || []).map(toMediaAsset),
    nextCursor: result.next_cursor || null,
  };
}

export async function deleteCloudinaryMedia(publicId: string): Promise<void> {
  if (!isCloudinaryConfigured()) throw new Error("Cloudinary is not configured.");
  if (!publicId.startsWith(CLOUDINARY_MEDIA_PREFIX)) throw new Error("Invalid media asset.");

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });
  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error("Cloudinary could not delete this asset.");
  }
}

export default cloudinary;
