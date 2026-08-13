"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  Image as ImageIcon,
  Images,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { MediaAsset } from "@/types/media";
import { getOptimizedImageUrl } from "@/lib/cloudinary";

interface MediaLibraryModalProps {
  open: boolean;
  onClose: () => void;
  onSelect?: (asset: MediaAsset) => void;
  selectedUrl?: string;
}

function assetName(publicId: string): string {
  return publicId.split("/").pop()?.replace(/[-_]+/g, " ") || "Uploaded logo";
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "Size unavailable";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibraryModal({ open, onClose, onSelect, selectedUrl }: MediaLibraryModalProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAssets = async (cursor?: string, append = false) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20_000);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/media${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Unable to load media.");
      setAssets((current) => append ? [...current, ...result.data] : result.data);
      setNextCursor(result.nextCursor || null);
    } catch (caught) {
      setError(caught instanceof DOMException && caught.name === "AbortError"
        ? "The media library took too long to respond. Select Refresh to try again."
        : caught instanceof Error ? caught.message : "Unable to load the media library.");
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    void loadAssets();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  const filteredAssets = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return assets;
    return assets.filter((asset) => assetName(asset.publicId).toLowerCase().includes(normalized));
  }, [assets, query]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/media", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Upload failed.");
      const asset = result.data as MediaAsset;
      setAssets((current) => [asset, ...current.filter((item) => item.publicId !== asset.publicId)]);
      onSelect?.(asset);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The image could not be uploaded.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const deleteAsset = async (asset: MediaAsset) => {
    setDeleting(asset.publicId);
    setError(null);
    try {
      const response = await fetch("/api/admin/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId: asset.publicId }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Delete failed.");
      setAssets((current) => current.filter((item) => item.publicId !== asset.publicId));
      setConfirmDelete(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The image could not be deleted.");
    } finally {
      setDeleting(null);
    }
  };

  if (!open) return null;

  return (
    <div className="media-library-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="media-library"
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-library-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="media-library__header">
          <div className="media-library__title">
            <span><Images /></span>
            <div>
              <p>Admin assets</p>
              <h2 id="media-library-title">Media library</h2>
            </div>
          </div>
          <div className="media-library__header-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadFile(file);
              }}
            />
            <button type="button" className="media-library__upload" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
              {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
              {uploading ? "Uploading" : "Upload logo"}
            </button>
            <button type="button" className="media-library__close" onClick={onClose} aria-label="Close media library"><X /></button>
          </div>
        </header>

        <div className="media-library__tools">
          <label className="media-library__search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search uploaded logos" /></label>
          <button type="button" onClick={() => void loadAssets()} disabled={loading} aria-label="Refresh media library"><RefreshCw className={loading ? "animate-spin" : ""} />Refresh</button>
        </div>

        {error && <div className="media-library__error" role="alert"><AlertCircle /><span>{error}</span><button type="button" onClick={() => setError(null)} aria-label="Dismiss error"><X /></button></div>}

        <div className="media-library__body">
          {loading && assets.length === 0 ? (
            <div className="media-library__state"><Loader2 className="animate-spin" /><h3>Loading your logos</h3><p>Fetching reusable assets from Cloudinary.</p></div>
          ) : filteredAssets.length === 0 ? (
            <div className="media-library__state"><ImageIcon /><h3>{query ? "No matching logos" : "Your library is empty"}</h3><p>{query ? "Try a different search." : "Upload a logo once, then reuse it across events."}</p></div>
          ) : (
            <div className="media-library__grid">
              {filteredAssets.map((asset) => {
                const selected = selectedUrl === asset.url;
                const askingDelete = confirmDelete === asset.publicId;
                return (
                  <article className={`media-asset ${selected ? "is-selected" : ""}`} key={asset.publicId}>
                    <button type="button" className="media-asset__select" onClick={() => onSelect?.(asset)} disabled={!onSelect} aria-label={`Select ${assetName(asset.publicId)}`}>
                      <span className="media-asset__image">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getOptimizedImageUrl(asset.url, { width: 360, height: 240, crop: "fit" })} alt="" />
                      </span>
                      <span className="media-asset__copy"><strong>{assetName(asset.publicId)}</strong><small>{asset.width && asset.height ? `${asset.width} × ${asset.height}` : "Dimensions unavailable"} · {formatBytes(asset.bytes)}</small></span>
                      {selected && <i><Check /></i>}
                    </button>
                    <div className="media-asset__actions">
                      {askingDelete ? (
                        <><span>Delete permanently?</span><button type="button" onClick={() => setConfirmDelete(null)}>Cancel</button><button type="button" className="is-danger" disabled={deleting === asset.publicId} onClick={() => void deleteAsset(asset)}>{deleting === asset.publicId ? <Loader2 className="animate-spin" /> : "Delete"}</button></>
                      ) : (
                        <button type="button" onClick={() => setConfirmDelete(asset.publicId)}><Trash2 />Delete</button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          {nextCursor && !query && <button type="button" className="media-library__more" disabled={loading} onClick={() => void loadAssets(nextCursor, true)}>{loading ? <Loader2 className="animate-spin" /> : null}Load more</button>}
        </div>
      </section>
    </div>
  );
}
