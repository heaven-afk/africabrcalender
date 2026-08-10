"use client";

import React, { useRef, useState } from "react";
import { Image as ImageIcon, Link2, Upload, X } from "lucide-react";

interface LogoUploadInputProps { value: string; onChange: (value: string) => void; label?: string; }

export const LogoUploadInput: React.FC<LogoUploadInputProps> = ({ value, onChange, label = "Organization logo" }) => {
  const [mode, setMode] = useState<"file" | "url">("file");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { window.alert("Choose an image smaller than 3MB."); return; }
    const reader = new FileReader();
    reader.onload = (readEvent) => { if (readEvent.target?.result) onChange(readEvent.target.result as string); };
    reader.readAsDataURL(file);
  };

  return (
    <div className="logo-field">
      <div className="logo-field__head"><span><ImageIcon />{label}</span><div><button type="button" className={mode === "file" ? "is-active" : ""} onClick={() => setMode("file")}><Upload />Upload</button><button type="button" className={mode === "url" ? "is-active" : ""} onClick={() => setMode("url")}><Link2 />URL</button></div></div>
      <div className="logo-field__control">
        {value && <div className="logo-field__preview">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={value} alt="Organization logo preview" onError={(event) => { event.currentTarget.style.display = "none"; }} /><button type="button" onClick={() => onChange("")} aria-label="Remove logo"><X /></button></div>}
        {mode === "file" ? <><input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} hidden /><button type="button" className="logo-field__upload" onClick={() => fileInputRef.current?.click()}><Upload /><span>{value ? "Replace logo" : "Choose a logo"}</span><small>PNG, JPG or WebP · 3MB max</small></button></> : <input type="url" value={value} onChange={(event) => onChange(event.target.value)} placeholder="https://example.com/logo.png" />}
      </div>
    </div>
  );
};
