/**
 * Pure client-side utility functions for Cloudinary URL formatting and optimization.
 * This file contains no Node.js server dependencies, ensuring it can be safely bundled
 * into browser client components without Webpack module resolution issues.
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  crop?: string;
  quality?: string;
}

/**
 * Transforms a Cloudinary URL to include auto format, auto quality, and optional resizing options.
 * Non-Cloudinary URLs or invalid inputs are returned as-is.
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  options?: ImageOptimizationOptions
): string {
  if (!url) return "";

  // Check if it is a Cloudinary URL
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }

  const transformParts: string[] = ["f_auto", `q_${options?.quality || "auto"}`];

  if (options?.width) transformParts.push(`w_${options.width}`);
  if (options?.height) transformParts.push(`h_${options.height}`);
  if (options?.crop) transformParts.push(`c_${options.crop}`);

  const transformString = transformParts.join(",");

  // Insert transformations after '/upload/'
  return url.replace("/upload/", `/upload/${transformString}/`);
}

export function getCloudinaryPublicId(url: string | null | undefined): string | null {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) return null;

  try {
    const pathname = new URL(url).pathname;
    const folderMarker = "/africa-calendar/";
    const folderIndex = pathname.indexOf(folderMarker);
    if (folderIndex === -1) return null;

    const assetPath = decodeURIComponent(pathname.slice(folderIndex + 1));
    return assetPath.replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
}
