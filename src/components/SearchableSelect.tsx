"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Gamepad2, Search, X } from "lucide-react";

export interface SelectItem {
  value: string;
  label: string;
  description?: string;
  logo?: string;
  icon?: React.ElementType;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  items: SelectItem[];
  placeholder: string;
  searchPlaceholder: string;
  emptyLabel?: string;
  align?: "left" | "right";
}

const ItemMark = ({ item }: { item: SelectItem }) => {
  const [failed, setFailed] = useState(false);
  const Icon = item.icon || Gamepad2;
  return item.logo && !failed ? <span className="smart-select__logo">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={item.logo} alt="" onError={() => setFailed(true)} /></span> : <span className="smart-select__logo"><Icon /></span>;
};

export const SearchableSelect: React.FC<SearchableSelectProps> = ({ value, onChange, items, placeholder, searchPlaceholder, emptyLabel = "No matches", align = "left" }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = items.find((item) => item.value === value);
  const filtered = useMemo(() => items.filter((item) => `${item.label} ${item.description || ""}`.toLowerCase().includes(query.trim().toLowerCase())), [items, query]);

  useEffect(() => {
    const closeOutside = (event: MouseEvent) => { if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false); };
    const closeEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", closeOutside); document.addEventListener("keydown", closeEscape);
    return () => { document.removeEventListener("mousedown", closeOutside); document.removeEventListener("keydown", closeEscape); };
  }, []);

  return <div className={`smart-select smart-select--${align}`} ref={rootRef}>
    <button type="button" className="smart-select__trigger" onClick={() => setOpen((current) => !current)} aria-haspopup="listbox" aria-expanded={open}>
      {selected ? <><ItemMark item={selected} /><span><strong>{selected.label}</strong>{selected.description && <small>{selected.description}</small>}</span></> : <><span className="smart-select__logo"><Gamepad2 /></span><span><strong>{placeholder}</strong></span></>}
      <ChevronDown />
    </button>
    {open && <div className="smart-select__popover">
      <label className="smart-select__search"><Search /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder} />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X /></button>}</label>
      <div className="smart-select__list" role="listbox">{filtered.length ? filtered.map((item) => <button type="button" key={item.value} role="option" aria-selected={item.value === value} className={item.value === value ? "is-selected" : ""} onClick={() => { onChange(item.value); setOpen(false); setQuery(""); }}><ItemMark item={item} /><span><strong>{item.label}</strong>{item.description && <small>{item.description}</small>}</span>{item.value === value && <Check />}</button>) : <p>{emptyLabel}</p>}</div>
    </div>}
  </div>;
};
