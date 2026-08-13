"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Image as ImageIcon, Images, Link2, Loader2, Trash2, Upload } from "lucide-react";
import { MediaLibraryModal } from "@/components/MediaLibraryModal";
import { MediaAsset } from "@/types/media";

interface LogoUploadInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  adminMedia?: boolean;
  pendingFile?: File | null;
  onPendingFileChange?: (file: File | null) => void;
}

const acceptedTypes = "image/png,image/jpeg,image/webp,image/gif,image/avif";

export const LogoUploadInput: React.FC<LogoUploadInputProps> = ({
  value,
  onChange,
  label = "Organization logo",
  adminMedia = false,
  pendingFile = null,
  onPendingFileChange,
}) => {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrl, setShowUrl] = useState(Boolean(value) && !pendingFile);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!pendingFile) {
      setLocalPreview(null);
      return;
    }
    const preview = URL.createObjectURL(pendingFile);
    setLocalPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [pendingFile]);

  const previewUrl = localPreview || value;

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.split(",").includes(file.type)) return "Use a PNG, JPG, WebP, GIF, or AVIF image.";
    if (file.size > 5 * 1024 * 1024) return "Images must be 5 MB or smaller.";
    return null;
  };

  const chooseFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setShowUrl(false);
    if (!adminMedia) {
      onPendingFileChange?.(file);
      onChange("");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/media", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Upload failed.");
      onChange((result.data as MediaAsset).url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The image could not be uploaded.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const clearLogo = () => {
    onChange("");
    onPendingFileChange?.(null);
    setShowUrl(false);
    setError(null);
  };

  const selectAsset = (asset: MediaAsset) => {
    onChange(asset.url);
    onPendingFileChange?.(null);
    setLibraryOpen(false);
    setShowUrl(false);
    setError(null);
  };

  return (
    <div className="logo-picker">
      <div className="logo-picker__heading"><span>{label}</span>{adminMedia && <small><Check />Admin media</small>}</div>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void chooseFile(file);
        }}
      />

      <div className={`logo-picker__selection ${previewUrl ? "has-logo" : ""}`}>
        <div className="logo-picker__preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {previewUrl ? <img src={previewUrl} alt="Organization logo preview" /> : <ImageIcon />}
        </div>
        <div className="logo-picker__summary">
          <strong>{previewUrl ? (pendingFile?.name || "Logo selected") : "Add an organization logo"}</strong>
          <span>{pendingFile ? "Uploads securely when the event is submitted." : adminMedia ? "Upload a new image or reuse one from your library." : "Upload an image or provide a public image URL."}</span>
        </div>
        {previewUrl && <button type="button" className="logo-picker__remove" onClick={clearLogo} aria-label="Remove selected logo"><Trash2 /></button>}
      </div>

      <div className="logo-picker__actions">
        <button type="button" className="is-primary" disabled={uploading} onClick={() => fileInputRef.current?.click()}>{uploading ? <Loader2 className="animate-spin" /> : <Upload />}{uploading ? "Uploading" : previewUrl ? "Replace" : "Upload image"}</button>
        {adminMedia && <button type="button" onClick={() => setLibraryOpen(true)}><Images />Browse library</button>}
        <button type="button" className={showUrl ? "is-active" : ""} onClick={() => setShowUrl((current) => !current)}><Link2 />Use URL</button>
      </div>

      {showUrl && (
        <label className="logo-picker__url">
          <span>Image URL</span>
          <input
            type="url"
            value={value}
            onChange={(event) => {
              onChange(event.target.value);
              onPendingFileChange?.(null);
              setError(null);
            }}
            placeholder="https://example.com/logo.png"
          />
        </label>
      )}

      {error && <div className="logo-picker__error" role="alert"><AlertCircle /><span>{error}</span></div>}

      {adminMedia && <MediaLibraryModal open={libraryOpen} onClose={() => setLibraryOpen(false)} onSelect={selectAsset} selectedUrl={value} />}
    </div>
  );
};
