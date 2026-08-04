"use client";

import React from "react";
import { format } from "date-fns";
import {
  LayoutGrid, Calendar, CalendarDays, Trophy,
  Search, Share2, HelpCircle, ChevronLeft, ChevronRight, CalendarCheck, Globe, CalendarPlus,
} from "lucide-react";

export type ViewMode = "grid" | "list" | "week" | "tournaments";

interface HeaderProps {
  currentDate: Date;
  onToday: () => void;
  onScrollToMonth: (direction: "prev" | "next" | "today") => void;
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
  onCommandPalette: () => void;
  onExport: () => void;
  onWalkthrough: () => void;
  onBookEvent: () => void;
  selectedRegion: string | null;
  onRegionChange: (r: string | null) => void;
  availableRegions: string[];
}

const TOOLBAR_VIEWS = [
  { id: "grid" as ViewMode,        icon: <LayoutGrid className="w-[14px] h-[14px] sm:w-[15px] sm:h-[15px]" />, label: "Grid" },
  { id: "list" as ViewMode,        icon: <CalendarDays className="w-[14px] h-[14px] sm:w-[15px] sm:h-[15px]" />, label: "Calendar" },
  { id: "week" as ViewMode,        icon: <Calendar className="w-[14px] h-[14px] sm:w-[15px] sm:h-[15px]" />,   label: "Week" },
  { id: "tournaments" as ViewMode, icon: <Trophy className="w-[14px] h-[14px] sm:w-[15px] sm:h-[15px]" />,     label: "Tournaments" },
];

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  onToday,
  onScrollToMonth,
  viewMode,
  onViewModeChange,
  onCommandPalette,
  onExport,
  onWalkthrough,
  onBookEvent,
  selectedRegion,
  onRegionChange,
  availableRegions,
}) => {
  const monthYearLabel = format(currentDate, "MMMM yyyy");

  return (
    <header className="sticky top-0 z-50 w-full flex flex-col shadow-2xl">
      {/* Subtle metallic gold line accent */}
      <div className="h-[1px] w-full bg-gradient-to-r from-amber-500/10 via-amber-400/60 to-amber-500/10" />

      {/* ─── LAYER 1: Main Brand & Primary Action Bar ─────────────────────── */}
      <div className="liquid-glass-header w-full border-b border-white/[0.06] backdrop-blur-2xl">
        <div className="flex items-center justify-between px-3 sm:px-6 h-12 max-w-[1400px] mx-auto w-full gap-2">
          
          {/* Layer 1 Left: Name & Logo (Africa BR Calendar) */}
          <div
            className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform shrink-0"
            onClick={onToday}
            title="Return to Today"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.15)]">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="flex flex-col items-start leading-none">
              <span className="font-display font-bold text-white text-[13px] sm:text-[14px] tracking-[0.14em] uppercase">
                Africa
              </span>
              <span className="font-display font-semibold text-amber-400 text-[8.5px] sm:text-[9px] tracking-[0.22em] uppercase mt-0.5">
                BR Calendar
              </span>
            </div>
          </div>

          {/* Layer 1 Right: Action buttons (Book Event, Search, Share, How To) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 touch-manipulation">
            <button
              onClick={onBookEvent}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-extrabold text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 shadow-[0_0_12px_rgba(245,158,11,0.25)] transition-all shrink-0"
              title="Schedule / Book your own event"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>Book Event</span>
            </button>

            <div className="w-px h-3.5 bg-white/10 mx-0.5 hidden xs:block shrink-0" />

            <button
              onClick={onCommandPalette}
              className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1 rounded-lg liquid-glass-input text-zinc-400 hover:text-white transition-all text-[11px]"
              title="Search (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-zinc-400 font-medium">Search</span>
            </button>

            <button
              onClick={onCommandPalette}
              className="toolbar-btn sm:hidden"
              title="Search"
              aria-label="Search"
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
            </button>

            <button
              onClick={onExport}
              className="toolbar-btn"
              title="Share / Export Calendar"
              aria-label="Share"
            >
              <Share2 className="w-3.5 h-3.5 text-zinc-300 hover:text-amber-400" />
            </button>

            <button
              onClick={onWalkthrough}
              className="toolbar-btn"
              title="How To / Walkthrough"
              aria-label="How To"
            >
              <HelpCircle className="w-3.5 h-3.5 text-zinc-300 hover:text-amber-400" />
            </button>
          </div>

        </div>
      </div>

      {/* ─── LAYER 2: Sticky Controls & Navigation Sub-Header Bar ─────────── */}
      <div className="bg-[#0b0b0e]/90 backdrop-blur-xl border-b border-white/[0.08] w-full py-1">
        <div className="flex items-center justify-between px-3 sm:px-6 h-10 max-w-[1400px] mx-auto w-full gap-2">
          
          {/* Layer 2 Left: View switcher & Region Selector */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* View mode toolbar */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              {TOOLBAR_VIEWS.map((v) => (
                <button
                  key={v.id + v.label}
                  onClick={() => onViewModeChange(v.id)}
                  title={v.label}
                  aria-label={v.label}
                  className={`toolbar-btn ${viewMode === v.id ? "active" : ""}`}
                >
                  {v.icon}
                </button>
              ))}
            </div>

            {/* Region dropdown */}
            {availableRegions.length > 0 && (
              <div className="hidden xs:flex items-center gap-1.5 liquid-glass-input rounded-lg px-2 py-0.5 text-xs">
                <Globe className="w-3 h-3 text-amber-400 shrink-0" />
                <select
                  value={selectedRegion || ""}
                  onChange={(e) => onRegionChange(e.target.value || null)}
                  className="bg-transparent text-zinc-300 text-[11px] font-medium outline-none cursor-pointer"
                >
                  <option value="" className="bg-[#121216] text-white">All Regions</option>
                  {availableRegions.map((r) => (
                    <option key={r} value={r} className="bg-[#121216] text-white">{r}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Layer 2 Right: Navigation icons & Current Month/Year Display */}
          <div className="flex items-center gap-1 sm:gap-1.5 touch-manipulation">
            <span className="hidden md:inline-block text-[11px] font-bold text-amber-300 uppercase tracking-widest mr-1">
              {monthYearLabel}
            </span>

            {/* Prev/Next buttons */}
            <button
              onClick={() => onScrollToMonth("prev")}
              className="toolbar-btn"
              title="Previous Month"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            
            <button
              onClick={() => onScrollToMonth("next")}
              className="toolbar-btn"
              title="Next Month"
              aria-label="Next Month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Today button */}
            <button
              onClick={onToday}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 border border-amber-500/25 transition-all shrink-0"
              title="Return to Today"
            >
              <CalendarCheck className="w-3 h-3 text-amber-400" />
              <span className="inline">Today</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
