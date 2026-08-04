"use client";

import React, {
  useState, useEffect, useMemo, useCallback, useRef,
} from "react";
import { format } from "date-fns";
import { Header, ViewMode } from "@/components/Header";
import { FiltersBar } from "@/components/FiltersBar";
import { NextEventCountdown } from "@/components/NextEventCountdown";
import { ListView } from "@/components/ListView";
import { GridView } from "@/components/GridView";
import { WeekView } from "@/components/WeekView";
import { TournamentsView } from "@/components/TournamentsView";
import { EventModal } from "@/components/EventModal";
import { CommandPaletteModal } from "@/components/CommandPaletteModal";
import { ExportModal } from "@/components/ExportModal";
import { WalkthroughModal } from "@/components/WalkthroughModal";
import { BookEventModal } from "@/components/BookEventModal";
import { DayDetailPopover } from "@/components/DayDetailPopover";
import { Footer } from "@/components/Footer";
import { CalendarEvent, EventCategory } from "@/types/event";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>([
    "ranking", "tournament", "scrim", "award", "podcast",
  ]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  // Data
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const [bookEventOpen, setBookEventOpen] = useState(false);
  const [dayPopover, setDayPopover] = useState<{ date: string; events: CalendarEvent[] } | null>(null);

  // Scroll ref passed into GridView
  const scrollFnRef = useRef<((dir: "prev" | "next" | "today") => void) | null>(null);

  // ─── ⌘K shortcut ──────────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(true); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // ─── Fetch ALL events for grid view ──────────────────
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/events", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setAllEvents(json.data);
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    const onVisible = () => { if (document.visibilityState === "visible") fetchEvents(); };
    const onFocus = () => fetchEvents();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchEvents]);

  // ─── Derived ──────────────────────────────────────────────────────────────
  const availableRegions = useMemo(() => {
    const s = new Set<string>();
    allEvents.forEach((e) => { if (e.region) s.add(e.region.trim()); });
    return Array.from(s);
  }, [allEvents]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter((evt) => {
      if (!selectedCategories.includes(evt.category)) return false;
      if (selectedRegion && evt.region?.trim() !== selectedRegion) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          evt.name.toLowerCase().includes(q) ||
          evt.orgName.toLowerCase().includes(q) ||
          (evt.stage || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allEvents, selectedCategories, selectedRegion, search]);

  const handleCategoryToggle = useCallback((c: EventCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(c)
        ? prev.length === 1 ? prev : prev.filter((x) => x !== c)
        : [...prev, c]
    );
  }, []);

  const handleDayClick = useCallback((date: string, evts: CalendarEvent[]) => {
    setDayPopover({ date, events: evts });
  }, []);

  const handleScrollToMonth = useCallback((dir: "prev" | "next" | "today") => {
    scrollFnRef.current?.(dir);
  }, []);

  // Return to current date (Today)
  const handleToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    scrollFnRef.current?.("today");
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0c] text-zinc-100">

      <Header
        currentDate={currentDate}
        onToday={handleToday}
        onScrollToMonth={handleScrollToMonth}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onCommandPalette={() => setCmdOpen(true)}
        onExport={() => setExportOpen(true)}
        onWalkthrough={() => setWalkthroughOpen(true)}
        onBookEvent={() => setBookEventOpen(true)}
        selectedRegion={selectedRegion}
        onRegionChange={setSelectedRegion}
        availableRegions={availableRegions}
      />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Page heading */}
        <div className="mb-5">
          <h1 className="font-display font-bold text-white text-xl sm:text-2xl tracking-wide">
            Africa BR Esports Calendar
          </h1>
          <p className="text-xs text-[#52525b] mt-0.5">
            Tournaments, ranking ladders &amp; daily scrims across African Battle Royale esports.
          </p>
        </div>

        {/* Live / Next Event Countdown Banner */}
        <NextEventCountdown events={allEvents} onSelectEvent={setSelectedEvent} />

        {/* Filters */}
        <FiltersBar
          search={search}
          onSearchChange={setSearch}
          selectedCategories={selectedCategories}
          onCategoryToggle={handleCategoryToggle}
          selectedRegion={selectedRegion}
          onRegionChange={setSelectedRegion}
          availableRegions={availableRegions}
          totalCount={allEvents.length}
          filteredCount={filteredEvents.length}
        />

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center p-24 gap-3">
            <Loader2 className="w-5 h-5 text-[#e8a33d] animate-spin" />
            <span className="text-sm text-[#52525b]">Loading events…</span>
          </div>
        ) : viewMode === "grid" ? (
          <GridView
            currentDate={currentDate}
            events={filteredEvents}
            allEvents={filteredEvents}
            onDayClick={handleDayClick}
            scrollToRef={scrollFnRef}
          />
        ) : viewMode === "week" ? (
          <WeekView
            currentDate={currentDate}
            events={filteredEvents}
            onSelectEvent={setSelectedEvent}
          />
        ) : viewMode === "tournaments" ? (
          <TournamentsView
            events={filteredEvents}
            onSelectEvent={setSelectedEvent}
          />
        ) : (
          <ListView events={filteredEvents} onSelectEvent={setSelectedEvent} />
        )}
      </main>

      <Footer />

      {/* Modals */}
      <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />

      <CommandPaletteModal
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        events={allEvents}
        onViewChange={setViewMode}
        onSelectEvent={setSelectedEvent}
      />

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        events={allEvents}
        currentMonth={currentDate}
      />

      <WalkthroughModal open={walkthroughOpen} onClose={() => setWalkthroughOpen(false)} />

      <BookEventModal
        open={bookEventOpen}
        onClose={() => setBookEventOpen(false)}
        onSuccess={fetchEvents}
      />

      {dayPopover && (
        <DayDetailPopover
          date={dayPopover.date}
          events={dayPopover.events}
          onClose={() => setDayPopover(null)}
          onSelectEvent={(evt) => { setSelectedEvent(evt); setDayPopover(null); }}
        />
      )}
    </div>
  );
}
