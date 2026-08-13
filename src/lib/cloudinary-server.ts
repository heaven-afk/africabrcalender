import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

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
}

/**
 * Uploads a file (Base64 data string or Buffer) to Cloudinary.
 */
export async function uploadToCloudinary(
  file: string | Buffer,
  options: { folder?: string; publicId?: string } = {}
): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Cloudinary credentials are not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment."
    );
  }

  const uploadFolder = options.folder || "africa-calendar";

  if (typeof file === "string") {
    const result: UploadApiResponse = await cloudinary.uploader.upload(file, {
      folder: uploadFolder,
      public_id: options.publicId,
      resource_type: "auto",
    });

    return {
      url: result.url,
      secure_url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: uploadFolder,
        public_id: options.publicId,
        resource_type: "auto",
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
        });
      }
    );

    uploadStream.end(file);
  });
}

export default cloudinary;
