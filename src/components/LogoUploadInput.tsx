"use client";

import React, { useState, useRef } from "react";
import { Upload, Link as LinkIcon, X } from "lucide-react";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert("Image size should be under 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        onChange(evt.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          {label}
        </label>
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
              onClick={() => onChange("")}
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
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 liquid-glass-input rounded-xl px-3.5 py-2 text-xs text-zinc-300 hover:text-white hover:border-amber-500/40 transition-all border border-dashed border-white/20"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>{value ? "Change Image File" : "Upload Logo Image File"}</span>
              </button>
            </div>
          ) : (
            <input
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://i.imgur.com/..."
              className="w-full liquid-glass-input rounded-xl px-3.5 py-2 text-sm text-white outline-none placeholder-zinc-500 transition-all"
            />
          )}
        </div>
      </div>
    </div>
  );
};
