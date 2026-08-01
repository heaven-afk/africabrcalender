"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import {
  Plus, Edit2, Trash2, Calendar, ArrowLeft,
  Loader2, CheckCircle2, AlertCircle, X, Clock, Globe, Tv,
} from "lucide-react";
import { CalendarEvent, EventCategory, ScrimRecurrence, StreamLink } from "@/types/event";

/* ─── Auth component ─────────────────────────────────────────────────────── */
function ClerkHeaderAuth() {
  try {
    const { user } = useUser();
    return (
      <>
        <SignedIn>
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-[#71717a] hidden sm:block">
              {user?.primaryEmailAddress?.emailAddress || user?.fullName}
            </span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-black"
              style={{ background: "linear-gradient(135deg,#e8a33d,#c9821f)" }}>
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
      </>
    );
  } catch {
    return (
      <span className="px-3 py-1.5 rounded-lg bg-[#e8a33d]/10 border border-[#e8a33d]/30 text-[#e8a33d] text-xs font-bold">
        Dev Admin Session
      </span>
    );
  }
}

/* ─── Input / label atoms ────────────────────────────────────────────────── */
const fieldCls = "w-full bg-[#0e0e10] border border-[#27272a] hover:border-[#3f3f46] focus:border-[#e8a33d] rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors placeholder-[#3f3f46]";
const labelCls = "block text-[10px] font-bold uppercase tracking-widest text-[#52525b] mb-1.5";

/* ─── Category colours ───────────────────────────────────────────────────── */
const CAT_META: Record<EventCategory, { label: string; ring: string; bg: string; text: string }> = {
  ranking:    { label: "Ranking",    ring: "border-amber-500",  bg: "bg-amber-500/10",  text: "text-amber-300" },
  tournament: { label: "Tournament", ring: "border-cyan-500",   bg: "bg-cyan-500/10",   text: "text-cyan-300" },
  scrim:      { label: "Scrim",      ring: "border-emerald-500",bg: "bg-emerald-500/10",text: "text-emerald-300" },
};

/* ─── Category pill ──────────────────────────────────────────────────────── */
const CatBadge: React.FC<{ cat: EventCategory }> = ({ cat }) => {
  const m = CAT_META[cat];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${m.ring} ${m.bg} ${m.text}`}>
      {m.label}
    </span>
  );
};

const DAYS = [
  { label: "Mon", val: 1 }, { label: "Tue", val: 2 }, { label: "Wed", val: 3 },
  { label: "Thu", val: 4 }, { label: "Fri", val: 5 }, { label: "Sat", val: 6 }, { label: "Sun", val: 0 },
];

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function AdminPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  /* Form fields */
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<EventCategory>("tournament");
  const [formStage, setFormStage] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formOrgName, setFormOrgName] = useState("");
  const [formOrgLogoUrl, setFormOrgLogoUrl] = useState("");
  const [formRegion, setFormRegion] = useState("");
  const [formDaysOfWeek, setFormDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [formStartTime, setFormStartTime] = useState("19:00");
  const [formEndTime, setFormEndTime] = useState("21:00");
  const [formTimezone, setFormTimezone] = useState("Africa/Lagos");
  const [formExceptions, setFormExceptions] = useState("");
  const [formStreamLinks, setFormStreamLinks] = useState<StreamLink[]>([{ label: "Main Stream", url: "" }]);
  const [formDiscordUrl, setFormDiscordUrl] = useState("");
  const [formWebsiteUrl, setFormWebsiteUrl] = useState("");

  /* ─── Data ──────────────────────────────────────────────────────────────── */
  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/events", { cache: "no-store" });
      const json = await res.json();
      if (json.success) setEvents(json.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadEvents(); }, []);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  /* ─── Modal helpers ─────────────────────────────────────────────────────── */
  const resetForm = () => {
    const today = new Date().toISOString().slice(0, 10);
    const oneYear = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
    setFormName(""); setFormCategory("tournament"); setFormStage("");
    setFormStartDate(today); setFormEndDate(today);
    setFormOrgName(""); setFormOrgLogoUrl(""); setFormRegion("");
    setFormDaysOfWeek([1, 2, 3, 4, 5]);
    setFormStartTime("19:00"); setFormEndTime("21:00");
    setFormTimezone("Africa/Lagos"); setFormExceptions("");
    setFormStreamLinks([{ label: "Main Stream", url: "" }]);
    setFormDiscordUrl(""); setFormWebsiteUrl("");
    void oneYear; // suppress unused warning
  };

  const openCreate = () => { setEditingEvent(null); resetForm(); setIsModalOpen(true); };

  const openEdit = (evt: CalendarEvent) => {
    setEditingEvent(evt);
    setFormName(evt.name); setFormCategory(evt.category); setFormStage(evt.stage || "");
    setFormStartDate(evt.startDate); setFormEndDate(evt.endDate);
    setFormOrgName(evt.orgName); setFormOrgLogoUrl(evt.orgLogoUrl || ""); setFormRegion(evt.region || "");
    if (evt.recurrence) {
      setFormDaysOfWeek(evt.recurrence.daysOfWeek);
      setFormStartTime(evt.recurrence.startTime);
      setFormEndTime(evt.recurrence.endTime);
      setFormTimezone(evt.recurrence.timezone);
      setFormExceptions(evt.recurrence.exceptions.join(", "));
    } else {
      setFormDaysOfWeek([1,2,3,4,5]); setFormStartTime("19:00"); setFormEndTime("21:00");
      setFormTimezone("Africa/Lagos"); setFormExceptions("");
    }
    setFormStreamLinks(evt.streamLinks?.length ? evt.streamLinks : [{ label: "Main Stream", url: "" }]);
    setFormDiscordUrl(evt.location?.discordUrl || "");
    setFormWebsiteUrl(evt.location?.websiteUrl || "");
    setIsModalOpen(true);
  };

  /* ─── Save ──────────────────────────────────────────────────────────────── */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate year range
    const startYear = parseInt(formStartDate.split("-")[0]);
    const endYear   = parseInt(formEndDate.split("-")[0]);
    if (startYear < 2020 || startYear > 2099 || endYear < 2020 || endYear > 2099) {
      showToast("error", "Invalid date year. Please use a year between 2020 and 2099.");
      return;
    }
    if (formEndDate < formStartDate) {
      showToast("error", "End date must be on or after start date.");
      return;
    }
    if (!formName.trim() || !formOrgName.trim()) {
      showToast("error", "Event title and organization are required.");
      return;
    }

    setIsSaving(true);
    const recurrence: ScrimRecurrence | null = formCategory === "scrim" ? {
      daysOfWeek: formDaysOfWeek, startTime: formStartTime, endTime: formEndTime,
      timezone: formTimezone,
      exceptions: formExceptions ? formExceptions.split(",").map(s => s.trim()).filter(Boolean) : [],
    } : null;

    const payload = {
      ...(editingEvent ? { id: editingEvent.id } : {}),
      name: formName.trim(), category: formCategory, stage: formStage || null,
      startDate: formStartDate, endDate: formEndDate,
      orgName: formOrgName.trim(), orgLogoUrl: formOrgLogoUrl || null,
      region: formRegion || null,
      streamLinks: formStreamLinks.filter(s => s.url.trim()),
      location: { discordUrl: formDiscordUrl || undefined, websiteUrl: formWebsiteUrl || undefined },
      recurrence,
    };

    try {
      const res = await fetch("/api/admin/events", {
        method: editingEvent ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", editingEvent ? "Event updated!" : "Event published!");
        setIsModalOpen(false);
        loadEvents();
      } else {
        showToast("error", json.error || "Failed to save.");
      }
    } catch { showToast("error", "Network error."); }
    finally { setIsSaving(false); }
  };

  /* ─── Delete ────────────────────────────────────────────────────────────── */
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/events?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) { showToast("success", "Event deleted."); loadEvents(); }
      else showToast("error", "Delete failed.");
    } catch { showToast("error", "Network error."); }
  };

  /* ─── Render ────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100">

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold shadow-2xl animate-fadeIn ${
          toast.type === "success"
            ? "bg-emerald-950 border-emerald-500/50 text-emerald-200"
            : "bg-rose-950 border-rose-500/50 text-rose-200"
        }`}>
          {toast.type === "success"
            ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {toast.text}
        </div>
      )}

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-[#1a1a1e] bg-[#0a0a0c]/95 backdrop-blur-xl">
        <div className="h-[2px]" style={{ background: "linear-gradient(90deg,#e8a33d,#c9821f)" }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-11 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/"
              className="p-1.5 rounded-lg border border-[#27272a] text-[#52525b] hover:text-white hover:border-[#3f3f46] transition-all"
              title="Back to Calendar">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-white text-[13px] tracking-[0.12em] uppercase">Admin Dashboard</span>
              <span className="text-[9px] text-[#52525b] tracking-wider mt-0.5">Manage events</span>
            </div>
          </div>
          <ClerkHeaderAuth />
        </div>
      </header>

      {/* ── Body ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Actions bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-white text-xl tracking-wider uppercase">
              Event Listings
            </h2>
            <p className="text-xs text-[#52525b] mt-0.5">
              {events.length} event{events.length !== 1 ? "s" : ""} registered
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-black text-xs font-extrabold shadow-lg hover:scale-[1.02] transition-transform"
            style={{ background: "linear-gradient(135deg,#e8a33d,#c9821f)" }}
          >
            <Plus className="w-4 h-4" />
            Create New Event
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center gap-3 p-20">
            <Loader2 className="w-5 h-5 text-[#e8a33d] animate-spin" />
            <span className="text-sm text-[#52525b]">Loading events…</span>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 border border-dashed border-[#27272a] rounded-2xl">
            <Calendar className="w-10 h-10 text-[#27272a]" />
            <div className="text-center">
              <p className="font-display font-bold text-[#52525b] text-sm uppercase tracking-wider">No events yet</p>
              <p className="text-xs text-[#3f3f46] mt-1">Click "Create New Event" to get started.</p>
            </div>
            <button onClick={openCreate}
              className="px-4 py-2 rounded-xl text-black text-xs font-extrabold"
              style={{ background: "linear-gradient(135deg,#e8a33d,#c9821f)" }}>
              Add First Event
            </button>
          </div>
        ) : (
          <div className="border border-[#1a1a1e] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#1a1a1e] bg-[#0e0e10]">
                    {["Event & Org", "Category", "Stage / Phase", "Active Schedule", "Region", "Actions"].map((h, i) => (
                      <th key={h} className={`py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-[#e8a33d] ${i === 5 ? "text-right" : "text-left"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#111113]">
                  {events.map((evt) => (
                    <tr key={evt.id} className="hover:bg-white/[0.02] transition-colors group">

                      {/* Event & Org */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {evt.orgLogoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={evt.orgLogoUrl} alt={evt.orgName}
                              className="w-8 h-8 rounded-lg object-contain bg-[#111113] border border-[#27272a] p-0.5 shrink-0"
                              onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-[#1c1c20] border border-[#27272a] flex items-center justify-center text-[10px] font-bold text-[#71717a] shrink-0">
                              {evt.orgName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-white text-sm leading-tight">{evt.name}</div>
                            <div className="text-[11px] text-[#52525b] mt-0.5">{evt.orgName}</div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <CatBadge cat={evt.category} />
                      </td>

                      {/* Stage */}
                      <td className="py-3.5 px-4 text-[#71717a]">
                        {evt.stage || <span className="text-[#3f3f46]">—</span>}
                      </td>

                      {/* Schedule */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-[#a1a1aa]">
                          <Calendar className="w-3 h-3 text-[#52525b] shrink-0" />
                          <span>{evt.startDate}</span>
                          <span className="text-[#3f3f46]">→</span>
                          <span>{evt.endDate}</span>
                        </div>
                        {evt.category === "scrim" && evt.recurrence && (
                          <div className="flex items-center gap-1 mt-0.5 text-emerald-400">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span className="text-[10px] font-semibold">
                              {evt.recurrence.startTime}–{evt.recurrence.endTime} · {evt.recurrence.timezone}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Region */}
                      <td className="py-3.5 px-4 text-[#71717a]">
                        {evt.region || <span className="text-[#3f3f46]">Global</span>}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openEdit(evt)}
                            className="p-1.5 rounded-lg border border-transparent text-[#52525b] hover:text-[#e8a33d] hover:bg-[#e8a33d]/10 hover:border-[#e8a33d]/20 transition-all"
                            title="Edit">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(evt.id, evt.name)}
                            className="p-1.5 rounded-lg border border-transparent text-[#52525b] hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all"
                            title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* ── Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="relative w-full max-w-2xl bg-[#111113] border border-[#27272a] rounded-2xl shadow-2xl my-8 overflow-hidden animate-scaleIn">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1e]">
              <div>
                <h3 className="font-display font-bold text-white text-base tracking-wider uppercase">
                  {editingEvent ? "Edit Event" : "Create New Event"}
                </h3>
                {editingEvent && <p className="text-xs text-[#52525b] mt-0.5">{editingEvent.name}</p>}
              </div>
              <button onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[#52525b] hover:text-white hover:bg-white/5 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-5 space-y-5">

              {/* Category selector */}
              <div>
                <label className={labelCls}>Category *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["ranking", "tournament", "scrim"] as EventCategory[]).map((cat) => {
                    const m = CAT_META[cat];
                    const active = formCategory === cat;
                    return (
                      <button key={cat} type="button" onClick={() => setFormCategory(cat)}
                        className={`py-2.5 rounded-xl border text-center text-xs font-display font-bold uppercase tracking-wider transition-all ${
                          active ? `${m.ring} ${m.bg} ${m.text}` : "border-[#27272a] bg-[#0e0e10] text-[#52525b] hover:text-[#a1a1aa] hover:border-[#3f3f46]"
                        }`}>
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name + Org */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Event Title *</label>
                  <input type="text" required value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Winter Cup 2026"
                    className={fieldCls} />
                </div>
                <div>
                  <label className={labelCls}>Organization / Host *</label>
                  <input type="text" required value={formOrgName}
                    onChange={(e) => setFormOrgName(e.target.value)}
                    placeholder="e.g. Nova Esports"
                    className={fieldCls} />
                </div>
              </div>

              {/* Stage + Region */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Stage / Phase</label>
                  <input type="text" value={formStage}
                    onChange={(e) => setFormStage(e.target.value)}
                    placeholder="e.g. Group Stage, Finals"
                    className={fieldCls} />
                </div>
                <div>
                  <label className={labelCls}>Region</label>
                  <input type="text" value={formRegion}
                    onChange={(e) => setFormRegion(e.target.value)}
                    placeholder="e.g. West Africa, North Africa"
                    className={fieldCls} />
                </div>
              </div>

              {/* Org logo */}
              <div>
                <label className={labelCls}>Org Logo URL (optional)</label>
                <input type="url" value={formOrgLogoUrl}
                  onChange={(e) => setFormOrgLogoUrl(e.target.value)}
                  placeholder="https://i.ibb.co/..."
                  className={fieldCls} />
                {formOrgLogoUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={formOrgLogoUrl} alt="Logo preview"
                      className="w-10 h-10 rounded-lg object-contain bg-[#0e0e10] border border-[#27272a] p-0.5"
                      onError={(e) => { (e.target as HTMLElement).style.display = "none"; }} />
                    <span className="text-xs text-[#52525b]">Logo preview</span>
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Start Date *</label>
                  <input type="date" required value={formStartDate}
                    min="2020-01-01" max="2099-12-31"
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className={fieldCls} />
                </div>
                <div>
                  <label className={labelCls}>End Date *</label>
                  <input type="date" required value={formEndDate}
                    min={formStartDate || "2020-01-01"} max="2099-12-31"
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className={fieldCls} />
                  {formCategory === "scrim" && (
                    <p className="text-[10px] text-[#52525b] mt-1">
                      For recurring scrims, set this to when the scrim season ends (e.g. end of year).
                    </p>
                  )}
                </div>
              </div>

              {/* Scrim recurrence */}
              {formCategory === "scrim" && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Recurring Schedule</span>
                  </div>

                  <div>
                    <label className={labelCls}>Active Days</label>
                    <div className="flex flex-wrap gap-1.5">
                      {DAYS.map(({ label, val }) => {
                        const on = formDaysOfWeek.includes(val);
                        return (
                          <button key={val} type="button"
                            onClick={() => setFormDaysOfWeek(on
                              ? formDaysOfWeek.filter(d => d !== val)
                              : [...formDaysOfWeek, val]
                            )}
                            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all ${
                              on ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
                                 : "border-[#27272a] bg-[#0e0e10] text-[#52525b] hover:text-[#a1a1aa]"
                            }`}>
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={labelCls}>Start Time</label>
                      <input type="time" value={formStartTime}
                        onChange={(e) => setFormStartTime(e.target.value)}
                        className={fieldCls} />
                    </div>
                    <div>
                      <label className={labelCls}>End Time</label>
                      <input type="time" value={formEndTime}
                        onChange={(e) => setFormEndTime(e.target.value)}
                        className={fieldCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Timezone</label>
                      <select value={formTimezone}
                        onChange={(e) => setFormTimezone(e.target.value)}
                        className={fieldCls}>
                        <option value="Africa/Lagos">WAT — Lagos</option>
                        <option value="Africa/Cairo">EET — Cairo</option>
                        <option value="Africa/Johannesburg">SAST — Joburg</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Skip Dates (comma-separated YYYY-MM-DD)</label>
                    <input type="text" value={formExceptions}
                      onChange={(e) => setFormExceptions(e.target.value)}
                      placeholder="2026-12-25, 2026-01-01"
                      className={fieldCls} />
                  </div>
                </div>
              )}

              {/* Stream URL */}
              <div>
                <label className={labelCls}><Tv className="inline w-3 h-3 mr-1" />Broadcast Stream URL</label>
                <input type="url"
                  value={formStreamLinks[0]?.url || ""}
                  onChange={(e) => setFormStreamLinks([{ label: "Main Stream", url: e.target.value }])}
                  placeholder="https://youtube.com/live/..."
                  className={fieldCls} />
              </div>

              {/* Discord + Website */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}><Globe className="inline w-3 h-3 mr-1" />Discord URL</label>
                  <input type="url" value={formDiscordUrl}
                    onChange={(e) => setFormDiscordUrl(e.target.value)}
                    placeholder="https://discord.gg/..."
                    className={fieldCls} />
                </div>
                <div>
                  <label className={labelCls}><Globe className="inline w-3 h-3 mr-1" />Website URL</label>
                  <input type="url" value={formWebsiteUrl}
                    onChange={(e) => setFormWebsiteUrl(e.target.value)}
                    placeholder="https://..."
                    className={fieldCls} />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-[#1a1a1e] flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#1c1c20] border border-[#27272a] text-[#a1a1aa] text-sm font-semibold hover:text-white hover:border-[#3f3f46] transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-black text-sm font-extrabold shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#e8a33d,#c9821f)" }}>
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingEvent ? "Save Changes" : "Publish Event"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
