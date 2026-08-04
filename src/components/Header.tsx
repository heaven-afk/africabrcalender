"use client";

import React from "react";
import {
  LayoutGrid, Calendar, CalendarDays, List, Trophy,
  Search, Share2, HelpCircle, ChevronLeft, ChevronRight, CalendarCheck, Globe,
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
  selectedRegion,
  onRegionChange,
  availableRegions,
}) => {
  return (
    <header className="sticky top-0 z-50 liquid-glass-header w-full">
      {/* Subtle metallic gold line accent */}
      <div className="h-[1.5px] w-full bg-gradient-to-r from-amber-500/20 via-amber-400/80 to-amber-500/20" />

      <div className="flex items-center justify-between px-2.5 sm:px-6 h-12 sm:h-14 gap-1.5 sm:gap-4 max-w-[1400px] mx-auto w-full">

        {/* Left: wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 cursor-pointer" onClick={onToday}>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-white text-[11px] sm:text-[13px] tracking-[0.14em] uppercase">Africa</span>
              <span className="font-display font-semibold text-amber-400 text-[7.5px] sm:text-[9px] tracking-[0.2em] uppercase mt-0.5">BR Calendar</span>
            </div>
          </div>

          {availableRegions.length > 0 && (
            <>
              <div className="hidden md:block w-px h-4 bg-white/10" />
              <div className="hidden md:flex items-center gap-1.5 liquid-glass-input rounded-lg px-2.5 py-1 text-xs">
                <Globe className="w-3 h-3 text-amber-400" />
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
            </>
          )}
        </div>

        {/* Center: prev/next month scroll + Today button + view toolbar */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none py-0.5 touch-manipulation">
          {/* Prev/Next — scroll in grid view */}
          <button
            onClick={() => onScrollToMonth("prev")}
            className="toolbar-btn"
            title="Previous Month"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          
          <button
            onClick={() => onScrollToMonth("next")}
            className="toolbar-btn"
            title="Next Month"
            aria-label="Next Month"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Today / Return to Current Date button */}
          <button
            onClick={onToday}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 border border-amber-500/30 transition-all shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
            title="Return to Today"
          >
            <CalendarCheck className="w-3 h-3 text-amber-400" />
            <span className="hidden xs:inline">Today</span>
          </button>

          <div className="w-px h-3.5 bg-white/10 mx-0.5 sm:mx-1 shrink-0" />

          {/* View mode toolbar */}
          <div className="flex items-center gap-0.5 sm:gap-1 p-0.5 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md">
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
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 touch-manipulation">
          {/* ⌘K */}
          <button
            onClick={onCommandPalette}
            className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl liquid-glass-input text-zinc-400 hover:text-white transition-all text-[11px]"
            title="Search (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-zinc-500 font-medium">Search</span>
            <div className="flex items-center gap-0.5 ml-1">
              <span className="kbd">⌘</span><span className="kbd">K</span>
            </div>
          </button>
          <button onClick={onCommandPalette} className="toolbar-btn sm:hidden" title="Search" aria-label="Search">
            <Search className="w-3.5 h-3.5 text-amber-400" />
          </button>
          <button onClick={onExport} className="toolbar-btn" title="Export Calendar" aria-label="Export Calendar"><Share2 className="w-[14px] h-[14px] sm:w-[15px] sm:h-[15px]" /></button>
          <button onClick={onWalkthrough} className="toolbar-btn" title="Help & Walkthrough" aria-label="Help"><HelpCircle className="w-[14px] h-[14px] sm:w-[15px] sm:h-[15px]" /></button>
        </div>

      </div>
    </header>
  );
};
