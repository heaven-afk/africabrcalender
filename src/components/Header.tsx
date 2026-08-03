"use client";

import React from "react";
import {
  LayoutGrid, Calendar, CalendarDays, List, Trophy,
  Search, Share2, HelpCircle, ChevronLeft, ChevronRight, CalendarCheck,
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
    <header className="sticky top-0 z-50 border-b border-surface-border/60 bg-[#0a0a0c]/95 backdrop-blur-xl">
      {/* Gold accent line */}
      <div className="h-[2px] w-full" style={{ background: "linear-gradient(90deg,#e8a33d,#c9821f)" }} />

      <div className="flex items-center justify-between px-3 sm:px-6 h-11 gap-1.5 sm:gap-3">

        {/* Left: wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex flex-col leading-none">
            <span className="font-display font-bold text-white text-[12px] sm:text-[13px] tracking-[0.12em] uppercase">Africa</span>
            <span className="font-display font-semibold text-gold text-[8px] sm:text-[9px] tracking-[0.2em] uppercase mt-0.5">BR Calendar</span>
          </div>

          {availableRegions.length > 0 && (
            <>
              <div className="hidden md:block w-px h-4 bg-surface-border" />
              <select
                value={selectedRegion || ""}
                onChange={(e) => onRegionChange(e.target.value || null)}
                className="hidden md:block bg-[#18181b] border border-[#27272a] hover:border-[#52525b] text-zinc-300 text-[11px] font-medium rounded-lg px-2 py-1 outline-none cursor-pointer transition-colors"
              >
                <option value="">All regions</option>
                {availableRegions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </>
          )}
        </div>

        {/* Center: prev/next month scroll + Today button + view toolbar */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
          {/* Prev/Next — scroll in grid view */}
          <button
            onClick={() => onScrollToMonth("prev")}
            className="toolbar-btn"
            title="Previous month"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          
          <button
            onClick={() => onScrollToMonth("next")}
            className="toolbar-btn"
            title="Next month"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Today / Return to Current Date button */}
          <button
            onClick={onToday}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-bold text-[#e8a33d] bg-[#e8a33d]/10 hover:bg-[#e8a33d]/20 border border-[#e8a33d]/30 transition-all shrink-0 ml-0.5"
            title="Return to Today"
          >
            <CalendarCheck className="w-3 h-3 text-[#e8a33d]" />
            <span>Today</span>
          </button>

          <div className="w-px h-3.5 sm:h-4 bg-[#27272a] mx-0.5 shrink-0" />

          {/* View mode toolbar */}
          {TOOLBAR_VIEWS.map((v) => (
            <button
              key={v.id + v.label}
              onClick={() => onViewModeChange(v.id)}
              title={v.label}
              className={`toolbar-btn ${viewMode === v.id ? "active" : ""}`}
            >
              {v.icon}
            </button>
          ))}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          {/* ⌘K */}
          <button
            onClick={onCommandPalette}
            className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#18181b] border border-[#27272a] text-[#52525b] hover:text-zinc-300 hover:border-[#3f3f46] transition-all text-[10px] mr-1"
            title="Search (Ctrl+K)"
          >
            <Search className="w-3 h-3" />
            <span className="kbd">⌘</span><span className="kbd">K</span>
          </button>
          <button onClick={onCommandPalette} className="toolbar-btn sm:hidden" title="Search">
            <Search className="w-3.5 h-3.5" />
          </button>
          <button onClick={onExport} className="toolbar-btn" title="Export"><Share2 className="w-[14px] h-[14px] sm:w-[15px] sm:h-[15px]" /></button>
          <button onClick={onWalkthrough} className="toolbar-btn" title="Help"><HelpCircle className="w-[14px] h-[14px] sm:w-[15px] sm:h-[15px]" /></button>
        </div>

      </div>
    </header>
  );
};
