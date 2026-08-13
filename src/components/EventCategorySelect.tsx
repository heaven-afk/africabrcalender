"use client";

import React, { useEffect, useRef, useState } from "react";
import { Award, CheckCircle2, ChevronDown, Crosshair, Medal, Mic2, Trophy } from "lucide-react";
import { EventCategory } from "@/types/event";

const categories: { value: EventCategory; label: string; description: string; icon: React.ElementType }[] = [
  { value: "tournament", label: "Tournament", description: "Brackets and competitive series", icon: Trophy },
  { value: "ranking", label: "Ranking season", description: "Ladders and leaderboard periods", icon: Medal },
  { value: "scrim", label: "Scrim schedule", description: "Recurring practice sessions", icon: Crosshair },
  { value: "award", label: "Awards", description: "Ceremonies and recognition", icon: Award },
  { value: "podcast", label: "Podcast or talk", description: "Shows, panels and broadcasts", icon: Mic2 },
];

export function EventCategorySelect({ value, onChange }: { value: EventCategory; onChange: (value: EventCategory) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = categories.find((item) => item.value === value) || categories[0];
  const SelectedIcon = selected.icon;

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="booking-category" ref={rootRef}>
      <button type="button" className="booking-category__trigger" onClick={() => setOpen((current) => !current)} aria-haspopup="listbox" aria-expanded={open}>
        <span><SelectedIcon /><span><strong>{selected.label}</strong><small>{selected.description}</small></span></span><ChevronDown />
      </button>
      {open && <div className="booking-category__menu" role="listbox">{categories.map((item) => {
        const Icon = item.icon;
        return <button type="button" role="option" aria-selected={item.value === value} className={item.value === value ? "is-selected" : ""} key={item.value} onClick={() => { onChange(item.value); setOpen(false); }}><Icon /><span><strong>{item.label}</strong><small>{item.description}</small></span>{item.value === value && <CheckCircle2 />}</button>;
      })}</div>}
    </div>
  );
}
