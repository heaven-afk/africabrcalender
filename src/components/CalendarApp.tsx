"use client";

import React, {
  useState, useEffect, useMemo, useCallback, useRef,
} from "react";
import { Header, ViewMode } from "@/components/Header";
import { FiltersBar, TimingFilter } from "@/components/FiltersBar";
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
import { Loader2, MapPinned, CalendarRange, Orbit, CircleAlert, RefreshCw } from "lucide-react";
import { addMonths } from "date-fns";

interface CalendarAppProps {
  initialEvents: CalendarEvent[];
  initialLoadError?: boolean;
}

export default function CalendarApp({ initialEvents, initialLoadError = false }: CalendarAppProps) {
  const loading = false;
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>([
    "ranking", "tournament", "scrim", "award", "podcast",
  ]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [timing, setTiming] = useState<TimingFilter>("all");

  // Data
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>(initialEvents);
  const [loadError, setLoadError] = useState<string | null>(initialLoadError ? "The event database could not be reached." : null);

  // Modals
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const [bookEventOpen, setBookEventOpen] = useState(false);
  const [dayPopover, setDayPopover] = useState<{ date: string; events: CalendarEvent[] } | null>(null);

  const closeWalkthrough = useCallback(() => {
    setWalkthroughOpen(false);
    try { window.localStorage.setItem("esports-calendar-tour-v1", "seen"); } catch { /* Storage may be unavailable. */ }
  }, []);

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

  useEffect(() => {
    let hasSeenTour = false;
    try { hasSeenTour = window.localStorage.getItem("esports-calendar-tour-v1") === "seen"; } catch { /* Show the tour when storage is unavailable. */ }
    if (hasSeenTour) return;
    const timer = window.setTimeout(() => setWalkthroughOpen(true), 800);
    return () => window.clearTimeout(timer);
  }, []);

  // ─── Fetch ALL events for grid view ──────────────────
  const fetchEvents = useCallback(async () => {
    try {
      setLoadError(null);
      const res = await fetch("/api/events", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Event feed returned ${res.status}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setAllEvents(json.data);
    } catch (err) {
      console.error("Failed to load events:", err);
      setLoadError("The event database could not be reached.");
    }
  }, []);

  useEffect(() => {
    const refreshTimer = window.setInterval(fetchEvents, 30_000);
    return () => {
      window.clearInterval(refreshTimer);
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
      if (selectedRegions.length && (!evt.region || !selectedRegions.includes(evt.region.trim()))) return false;
      if (selectedGames.length && (!evt.game || !selectedGames.includes(evt.game.trim()))) return false;
      if (timing !== "all") {
        const today = new Date().toISOString().slice(0, 10);
        const state = evt.endDate < today ? "past" : evt.startDate > today ? "upcoming" : "live";
        if (state !== timing) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          evt.name.toLowerCase().includes(q) ||
          evt.orgName.toLowerCase().includes(q) ||
          (evt.game || "").toLowerCase().includes(q) ||
          (evt.stage || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allEvents, selectedCategories, selectedRegions, selectedGames, timing, search]);

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
    if (dir === "today") setCurrentDate(new Date());
    else setCurrentDate((date) => addMonths(date, dir === "next" ? 1 : -1));
  }, []);

  // Return to current date (Today)
  const handleToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    scrollFnRef.current?.("today");
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="app-shell min-h-screen flex flex-col text-zinc-100">

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
      />

      <main className="flex-1 max-w-[1480px] w-full mx-auto px-3 sm:px-6 lg:px-8 pb-10 pt-5 sm:pt-8">

        <section className="dashboard-overview" aria-labelledby="calendar-title">
          <div className="dashboard-overview__copy">
            <div className="eyebrow"><Orbit aria-hidden="true" /> Global competitive schedule</div>
            <h1 id="calendar-title">Esports calendar</h1>
            <p>Tournaments, rankings, scrims, awards and broadcasts—organized and easy to follow.</p>
          </div>
          <div className="dashboard-overview__facts" aria-label="Calendar summary">
            <div><CalendarRange aria-hidden="true" /><strong>{allEvents.length}</strong><span>events listed</span></div>
            <div><MapPinned aria-hidden="true" /><strong>{availableRegions.length || "Global"}</strong><span>regions covered</span></div>
          </div>
        </section>

        {/* Live / Next Event Countdown Banner */}
        <NextEventCountdown events={allEvents} onSelectEvent={setSelectedEvent} />

        {/* Filters */}
        <FiltersBar
          search={search}
          onSearchChange={setSearch}
          selectedCategories={selectedCategories}
          onCategoryToggle={handleCategoryToggle}
          selectedRegions={selectedRegions}
          onRegionsChange={setSelectedRegions}
          selectedGames={selectedGames}
          onGamesChange={setSelectedGames}
          timing={timing}
          onTimingChange={setTiming}
        />

        {/* Content */}
        <div data-tour="schedule">
        {loading ? (
          <div className="loading-state">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading events from the database…</span>
          </div>
        ) : loadError ? (
          <div className="empty-state">
            <CircleAlert className="w-6 h-6" />
            <h3>Schedule unavailable</h3>
            <p>{loadError}</p>
            <button className="submit-event mt-4" onClick={fetchEvents}><RefreshCw className="w-4 h-4" /> Retry</button>
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
        </div>
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

      <WalkthroughModal open={walkthroughOpen} onClose={closeWalkthrough} />

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
