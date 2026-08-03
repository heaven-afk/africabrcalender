"use client";

import React from "react";
import { Search, X } from "lucide-react";
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
  { id: "ranking",    label: "Ranking",    dot: "bg-amber-400",  active: "border-amber-500/40 bg-amber-500/10 text-amber-300" },
  { id: "tournament", label: "Tournament", dot: "bg-cyan-400",   active: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" },
  { id: "scrim",      label: "Scrim",      dot: "bg-emerald-400",active: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" },
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      
      {/* Filters & Search row */}
      <div className="flex flex-1 items-center gap-2 overflow-x-auto scrollbar-none pb-0.5 max-w-full">
        {/* Search input */}
        <div className="relative shrink-0 sm:shrink">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#52525b]" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search…"
            className="w-36 sm:w-44 bg-[#18181b] border border-[#27272a] focus:border-[#52525b] text-sm text-white placeholder-[#52525b] rounded-lg pl-8 pr-7 py-1.5 outline-none transition-colors text-[12px] sm:text-[13px]"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#52525b] hover:text-white"
            >
              <X className="w-3 h-3" />
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
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all shrink-0 ${
                  on
                    ? cat.active
                    : "border-[#27272a] bg-[#18181b] text-[#52525b] hover:text-[#a1a1aa] hover:border-[#3f3f46]"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${on ? cat.dot : "bg-[#3f3f46]"}`} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Region pills */}
        {availableRegions.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-px h-4 bg-[#27272a] mx-0.5" />
            <button
              onClick={() => onRegionChange(null)}
              className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all shrink-0 ${
                !selectedRegion
                  ? "border-[#e8a33d]/40 bg-[#e8a33d]/10 text-[#e8a33d]"
                  : "border-[#27272a] bg-[#18181b] text-[#52525b] hover:text-[#a1a1aa]"
              }`}
            >
              All
            </button>
            {availableRegions.map((r) => (
              <button
                key={r}
                onClick={() => onRegionChange(selectedRegion === r ? null : r)}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all shrink-0 ${
                  selectedRegion === r
                    ? "border-[#e8a33d]/40 bg-[#e8a33d]/10 text-[#e8a33d]"
                    : "border-[#27272a] bg-[#18181b] text-[#52525b] hover:text-[#a1a1aa]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Event count */}
      <div className="text-[11px] text-[#52525b] shrink-0 self-end sm:self-auto">
        {filteredCount === totalCount ? (
          <span>{totalCount} event{totalCount !== 1 ? "s" : ""}</span>
        ) : (
          <span>{filteredCount} / {totalCount}</span>
        )}
      </div>
    </div>
  );
};
