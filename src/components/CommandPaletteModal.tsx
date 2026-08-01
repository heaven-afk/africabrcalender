"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  LayoutGrid,
  CalendarDays,
  Calendar,
  List,
  Trophy,
  X,
} from "lucide-react";
import { CalendarEvent } from "@/types/event";
import { ViewMode } from "./Header";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  onViewChange: (v: ViewMode) => void;
  onSelectEvent: (e: CalendarEvent) => void;
}

const VIEWS = [
  { id: "grid" as ViewMode, label: "Grid", icon: <LayoutGrid className="w-4 h-4" /> },
  { id: "list" as ViewMode, label: "Calendar", icon: <CalendarDays className="w-4 h-4" /> },
  { id: "week" as ViewMode, label: "Week", icon: <Calendar className="w-4 h-4" /> },
  { id: "tournaments" as ViewMode, label: "Tournaments", icon: <Trophy className="w-4 h-4" /> },
];

type ResultItem =
  | { kind: "view"; id: ViewMode; label: string; icon: React.ReactNode }
  | { kind: "event"; event: CalendarEvent };

export const CommandPaletteModal: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
  events,
  onViewChange,
  onSelectEvent,
}) => {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const results = useMemo<ResultItem[]>(() => {
    const q = query.toLowerCase().trim();

    const viewResults: ResultItem[] = VIEWS.filter(
      (v) => !q || v.label.toLowerCase().includes(q)
    ).map((v) => ({ kind: "view", ...v }));

    const eventResults: ResultItem[] = events
      .filter((e) => {
        if (!q) return true;
        return (
          e.name.toLowerCase().includes(q) ||
          e.orgName.toLowerCase().includes(q) ||
          (e.stage || "").toLowerCase().includes(q) ||
          (e.region || "").toLowerCase().includes(q)
        );
      })
      .slice(0, 12)
      .map((e) => ({ kind: "event", event: e }));

    return [...viewResults, ...eventResults];
  }, [query, events]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      const item = results[cursor];
      if (!item) return;
      if (item.kind === "view") {
        onViewChange(item.id);
        onClose();
      } else {
        onSelectEvent(item.event);
        onClose();
      }
    }
  };

  if (!open) return null;

  const catColor = (category: string) => {
    if (category === "ranking") return "text-amber-400";
    if (category === "tournament") return "text-cyan-400";
    return "text-emerald-400";
  };

  const hasViewResults = results.some((r) => r.kind === "view");
  const hasEventResults = results.some((r) => r.kind === "event");

  return (
    <div className="cmd-backdrop animate-fadeIn" onClick={onClose}>
      <div className="cmd-box animate-scaleIn" onClick={(e) => e.stopPropagation()}>
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#27272a]">
          <Search className="w-4 h-4 text-[#52525b] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setCursor(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search tournaments, views, regions…"
            className="flex-1 bg-transparent text-white placeholder-[#52525b] text-sm outline-none"
          />
          <button onClick={onClose} className="text-[#52525b] hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-96 overflow-y-auto py-1.5">
          {hasViewResults && (
            <div>
              <div className="px-4 py-2 text-[9px] font-bold tracking-widest uppercase text-[#3f3f46]">Views</div>
              {results.map((item, idx) => {
                if (item.kind !== "view") return null;
                return (
                  <button
                    key={item.id + item.label}
                    onClick={() => { onViewChange(item.id); onClose(); }}
                    onMouseEnter={() => setCursor(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      idx === cursor ? "bg-white/5 text-white" : "text-[#71717a] hover:bg-white/[0.03] hover:text-white"
                    }`}
                  >
                    <span className="text-[#52525b]">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {hasEventResults && (
            <div>
              <div className="px-4 py-2 text-[9px] font-bold tracking-widest uppercase text-[#3f3f46] mt-1">Events</div>
              {results.map((item, idx) => {
                if (item.kind !== "event") return null;
                return (
                  <button
                    key={item.event.id}
                    onClick={() => { onSelectEvent(item.event); onClose(); }}
                    onMouseEnter={() => setCursor(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${
                      idx === cursor ? "bg-white/5 text-white" : "text-[#71717a] hover:bg-white/[0.03] hover:text-white"
                    }`}
                  >
                    {item.event.orgLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.event.orgLogoUrl} alt={item.event.orgName}
                        className="w-6 h-6 rounded object-contain bg-black shrink-0"
                        onError={(e) => { (e.target as HTMLElement).style.display="none"; }}
                      />
                    ) : (
                      <div className="w-6 h-6 rounded bg-[#1c1c20] flex items-center justify-center text-[9px] font-bold text-[#71717a] shrink-0">
                        {item.event.orgName.slice(0,2).toUpperCase()}
                      </div>
                    )}
                    <span className="flex-1 text-left text-sm font-medium text-zinc-200 truncate">{item.event.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${catColor(item.event.category)}`}>{item.event.category}</span>
                      {item.event.region && <span className="text-[9px] text-[#52525b]">{item.event.region}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-[#52525b]">No results for &ldquo;{query}&rdquo;</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-[#27272a] flex items-center gap-3 text-[10px] text-[#3f3f46]">
          <span><span className="kbd">↑↓</span> navigate</span>
          <span><span className="kbd">↵</span> select</span>
          <span><span className="kbd">esc</span> close</span>
        </div>
      </div>
    </div>
  );
};
