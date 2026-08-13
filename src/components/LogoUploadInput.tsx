"use client";

import React, { useState, useRef } from "react";
import { Upload, Link as LinkIcon, X, Loader2, Cloud, AlertCircle } from "lucide-react";

interface LogoUploadInputProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
}

export const LogoUploadInput: React.FC<LogoUploadInputProps> = ({
  value,
  onChange,
  label = "Organization Logo",
}) => {
  const [mode, setMode] = useState<"file" | "url">(value?.startsWith("data:") ? "file" : "url");
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCloudinaryUrl = Boolean(value && value.includes("res.cloudinary.com"));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Image file size should be under 10MB.");
      return;
    }

    setUploading(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "africa-calendar");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to upload image to Cloudinary.");
      }

      onChange(data.url);
    } catch (err: any) {
      console.error("Cloudinary upload error:", err);
      setErrorMsg(err.message || "Failed to upload image. Please check Cloudinary configuration.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            {label}
          </label>
          {isCloudinaryUrl && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Cloud className="w-2.5 h-2.5" />
              Cloudinary
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 bg-white/[0.04] p-0.5 rounded-lg border border-white/10 text-[10px]">
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`px-2 py-0.5 rounded-md font-semibold transition-all flex items-center gap-1 ${
              mode === "file" ? "bg-amber-500 text-black shadow" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Upload className="w-2.5 h-2.5" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-2 py-0.5 rounded-md font-semibold transition-all flex items-center gap-1 ${
              mode === "url" ? "bg-amber-500 text-black shadow" : "text-zinc-400 hover:text-white"
            }`}
          >
            <LinkIcon className="w-2.5 h-2.5" />
            URL Link
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {value ? (
          <div className="relative group shrink-0">
            {/* Live Thumbnail Preview */}
            <img
              src={value}
              alt="Logo preview"
              className="w-9 h-9 rounded-xl object-contain bg-black/40 border border-amber-500/40 p-0.5 shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <button
              type="button"
              onClick={() => {
                onChange("");
                setErrorMsg(null);
              }}
              className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-500 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity shadow"
              title="Remove logo"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : null}

        <div className="flex-1">
          {mode === "file" ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 liquid-glass-input rounded-xl px-3.5 py-2 text-xs text-zinc-300 hover:text-white hover:border-amber-500/40 transition-all border border-dashed border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                    <span>Uploading to Cloudinary...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-amber-400" />
                    <span>{value ? "Change Cloudinary Image" : "Upload to Cloudinary"}</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <input
              type="url"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="https://res.cloudinary.com/... or https://..."
              className="w-full liquid-glass-input rounded-xl px-3.5 py-2 text-sm text-white outline-none placeholder-zinc-500 transition-all"
            />
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1.5 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
