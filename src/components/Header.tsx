"use client";

import React from "react";
import { format } from "date-fns";
import {
  LayoutGrid,
  Rows3,
  CalendarDays,
  Trophy,
  Search,
  Download,
  CircleHelp,
  ChevronLeft,
  ChevronRight,
  Plus,
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
}

const VIEWS = [
  { id: "grid" as ViewMode, icon: LayoutGrid, label: "Year" },
  { id: "list" as ViewMode, icon: Rows3, label: "Agenda" },
  { id: "week" as ViewMode, icon: CalendarDays, label: "Week" },
  { id: "tournaments" as ViewMode, icon: Trophy, label: "Events" },
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
}) => {
  const viewTabs = () => (
    <nav className="view-tabs" aria-label="Calendar views" data-tour="views">
      {VIEWS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          className={viewMode === id ? "is-active" : ""}
          onClick={() => onViewModeChange(id)}
          title={label}
          aria-label={`${label} view`}
          aria-current={viewMode === id ? "page" : undefined}
        >
          <Icon aria-hidden="true" /><span>{label}</span>
        </button>
      ))}
    </nav>
  );

  const brand = () => (
    <button className="brand-lockup" onClick={onToday} aria-label="Esports Calendar — return to today">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="brand-lockup__logo" src="/esports-calendar-logo.png" alt="Esports Calendar" />
    </button>
  );

  const monthStepper = () => (
    <div className="month-stepper">
      <button onClick={() => onScrollToMonth("prev")} aria-label="Previous month"><ChevronLeft /></button>
      <button className="month-stepper__label" onClick={onToday} aria-label="Return to current month">
        <span>{format(currentDate, "MMM")}</span><strong>{format(currentDate, "yyyy")}</strong>
      </button>
      <button onClick={() => onScrollToMonth("next")} aria-label="Next month"><ChevronRight /></button>
    </div>
  );

  return (
    <header className="match-header">
      <div className="match-header__inner">
        <div className="header-desktop">
          <div className="header-primary">
            {brand()}
            {viewTabs()}
          </div>

          <div className="header-context">
            <button className="header-search" onClick={onCommandPalette} aria-label="Search events" data-tour="search">
              <Search aria-hidden="true" /><span>Search events</span><kbd>⌘K</kbd>
            </button>
            {monthStepper()}
            <div className="header-tools">
              <button className="icon-action header-utility" onClick={onExport} aria-label="Download calendar file" title="Download calendar file" data-tour="export"><Download /></button>
              <button className="icon-action header-help" onClick={onWalkthrough} aria-label="Calendar help" title="Calendar help"><CircleHelp /></button>
            </div>
            <button className="submit-event" onClick={onBookEvent}><Plus aria-hidden="true" /><span>Add event</span></button>
          </div>
        </div>

        <div className="header-mobile">
          <div className="header-mobile__top">
            {brand()}
            <div className="header-mobile__top-actions">
              {monthStepper()}
              <button className="icon-action header-help" onClick={onWalkthrough} aria-label="Calendar help" title="Calendar help"><CircleHelp /></button>
              <button className="header-search" onClick={onCommandPalette} aria-label="Search events" data-tour="search"><Search aria-hidden="true" /></button>
            </div>
          </div>
          <div className="header-mobile__bottom">
            {viewTabs()}
            <button className="icon-action header-utility" onClick={onExport} aria-label="Download calendar file" title="Download calendar file" data-tour="export"><Download /></button>
            <button className="submit-event" onClick={onBookEvent}><Plus aria-hidden="true" /><span>Add event</span></button>
          </div>
        </div>
      </div>
    </header>
  );
};
