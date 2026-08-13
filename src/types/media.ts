export interface MediaAsset {
  publicId: string;
  url: string;
  width: number | null;
  height: number | null;
  bytes: number | null;
  format: string | null;
  createdAt: string | null;
}
