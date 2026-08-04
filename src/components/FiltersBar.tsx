"use client";

import React from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { EventCategory } from "@/types/event";

interface FiltersBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  selectedCategories: EventCategory[];
  onCategoryToggle: (c: EventCategory) => void;
  selectedRegion: string | null;
  onRegionChange: (r: string | null) => void;
  availableRegions: string[];
  totalCount: number;
  filteredCount: number;
}

const CATS: { id: EventCategory; label: string; dot: string; active: string }[] = [
  { id: "ranking",    label: "Ranking",    dot: "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]",   active: "border-amber-500/40 bg-amber-500/10 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]" },
  { id: "tournament", label: "Tournament", dot: "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]",     active: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.15)]" },
  { id: "scrim",      label: "Scrim",      dot: "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]", active: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]" },
];

export const FiltersBar: React.FC<FiltersBarProps> = ({
  search,
  onSearchChange,
  selectedCategories,
  onCategoryToggle,
  selectedRegion,
  onRegionChange,
  availableRegions,
  totalCount,
  filteredCount,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 p-2.5 sm:p-2 rounded-2xl liquid-glass border border-white/10 shadow-xl">
      
      {/* Filters & Search row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-2 flex-1 max-w-full">
        {/* Search input */}
        <div className="relative w-full sm:w-56 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-400/70" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events, organizers…"
            className="w-full liquid-glass-input text-xs text-white placeholder-zinc-500 rounded-xl pl-9 pr-8 py-2 outline-none"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-1.5 shrink-0">
          {CATS.map((cat) => {
            const on = selectedCategories.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryToggle(cat.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shrink-0 ${
                  on
                    ? cat.active
                    : "border-white/5 bg-white/[0.02] text-zinc-500 hover:text-zinc-300 hover:border-white/10"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${on ? cat.dot : "bg-zinc-600"}`} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Region pills */}
        {availableRegions.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button
              onClick={() => onRegionChange(null)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shrink-0 ${
                !selectedRegion
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                  : "border-white/5 bg-white/[0.02] text-zinc-500 hover:text-zinc-300 hover:border-white/10"
              }`}
            >
              All Regions
            </button>
            {availableRegions.map((r) => (
              <button
                key={r}
                onClick={() => onRegionChange(selectedRegion === r ? null : r)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shrink-0 ${
                  selectedRegion === r
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                    : "border-white/5 bg-white/[0.02] text-zinc-500 hover:text-zinc-300 hover:border-white/10"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Event count */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs font-medium text-zinc-400 shrink-0 self-end sm:self-auto">
        <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
        {filteredCount === totalCount ? (
          <span>{totalCount} event{totalCount !== 1 ? "s" : ""}</span>
        ) : (
          <span>Showing <strong className="text-white">{filteredCount}</strong> of {totalCount}</span>
        )}
      </div>
    </div>
  );
};
