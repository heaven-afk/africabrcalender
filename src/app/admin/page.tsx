"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Show, SignIn, UserButton, useUser, useClerk } from "@clerk/nextjs";
import {
  Plus, Edit2, Trash2, Calendar, ArrowLeft, Images, Eye, BarChart3,
  Loader2, CheckCircle2, AlertCircle, X, Clock, Repeat2, ShieldAlert, Lock, LogOut, MessageSquare,
  ShieldCheck, Type, Gamepad2, Tag, Building2, CalendarDays, Clock3, MapPin, Globe2,
} from "lucide-react";
import { CalendarEvent, EventCategory, StreamLink } from "@/types/event";
import { isAuthorizedAdminEmail } from "@/lib/adminPermissions";
import { LogoUploadInput } from "@/components/LogoUploadInput";
import { SearchableSelect } from "@/components/SearchableSelect";
import { DatePicker } from "@/components/DatePicker";
import { GAME_OPTIONS, REGION_OPTIONS, STREAM_OPTIONS, TIMEZONE_OPTIONS, getStreamPlatform } from "@/lib/eventCatalog";
import { TimePicker } from "@/components/TimePicker";
import { MediaLibraryModal } from "@/components/MediaLibraryModal";
import { EventModal } from "@/components/EventModal";
import { EventCategorySelect } from "@/components/EventCategorySelect";
import { AdminAnalyticsDashboard } from "@/components/AdminAnalyticsDashboard";

/* ─── Header Auth Component ────────────────────────────────────────────────── */
function ClerkHeaderAuth() {
  const { user } = useUser();
  const { signOut } = useClerk();
  return (
    <Show when="signed-in">
      <div className="flex items-center gap-3">
        <span className="text-xs text-[#71717a] hidden sm:block">
          {user?.primaryEmailAddress?.emailAddress || user?.fullName}
        </span>
        <UserButton />
        <button
          onClick={() => signOut()}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Log Out</span>
        </button>
      </div>
    </Show>
  );
}

/* ─── Input / label atoms ────────────────────────────────────────────────── */
const fieldCls = "w-full liquid-glass-input rounded-xl px-3.5 py-2 text-sm text-white outline-none placeholder-zinc-500 transition-all";
const labelCls = "block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5";

/* ─── Category colours ───────────────────────────────────────────────────── */
const CAT_META: Record<EventCategory, { label: string; ring: string; bg: string; text: string }> = {
  ranking:    { label: "Ranking",    ring: "border-amber-500",  bg: "bg-amber-500/10",  text: "text-amber-300" },
  tournament: { label: "Tournament", ring: "border-[#4F7CFF]", bg: "bg-[#4F7CFF]/10", text: "text-[#4F7CFF]" },
  scrim:      { label: "Scrim",      ring: "border-emerald-500",bg: "bg-emerald-500/10",text: "text-emerald-300" },
  award:      { label: "Award",      ring: "border-orange-500", bg: "bg-orange-500/10", text: "text-orange-300" },
  podcast:    { label: "Podcast",    ring: "border-rose-500",   bg: "bg-rose-500/10",   text: "text-rose-300" },
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

/* ─── Admin Content (Secured by Email Permission) ───────────────────────── */
function AdminContent() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const isAllowed = isAuthorizedAdminEmail(userEmail);

  if (isLoaded && !isAllowed) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="font-display font-bold text-white text-2xl tracking-wide mb-2">
          Administrator Access Restricted
        </h2>
        <p className="text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
          The account <span className="text-white font-semibold">{userEmail || "Signed In"}</span> does not have administrative privileges. If you are an organizer or moderator needing access, please request authorization from the admin team.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-[#18181b] border border-[#27272a] text-sm font-semibold text-neutral-300 hover:text-white transition-colors"
          >
            Return to Calendar
          </Link>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}

/* ─── Main Admin Dashboard Component ────────────────────────────────────── */
function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"published" | "pending" | "analytics">("published");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [pendingEvents, setPendingEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [viewingEvent, setViewingEvent] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  /* Form fields */
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<EventCategory>("tournament");
  const [formGame, setFormGame] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStage, setFormStage] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formOrgName, setFormOrgName] = useState("");
  const [formOrgLogoUrl, setFormOrgLogoUrl] = useState("");
  const [formRegion, setFormRegion] = useState("");
  const [formDaysOfWeek, setFormDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [formStartTime, setFormStartTime] = useState("19:00");
  const [formEndTime, setFormEndTime] = useState("21:00");
  const [formDailyRecurring, setFormDailyRecurring] = useState(false);
  const [formTimezone, setFormTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [formExceptions, setFormExceptions] = useState("");
  const timezoneOptions = useMemo(() => TIMEZONE_OPTIONS.some((item) => item.value === formTimezone) ? TIMEZONE_OPTIONS : [{ value: formTimezone, label: formTimezone, description: "Local timezone", icon: Clock }, ...TIMEZONE_OPTIONS], [formTimezone]);
  const [formStreamLinks, setFormStreamLinks] = useState<StreamLink[]>([{ label: "YouTube", url: "" }]);
  const [formDiscordUrl, setFormDiscordUrl] = useState("");
  const [formWebsiteUrl, setFormWebsiteUrl] = useState("");

  /* ─── Data ──────────────────────────────────────────────────────────────── */
  const loadEvents = async () => {
    setLoading(true);
    try {
      const resAll = await fetch("/api/events", { cache: "no-store" });
      const jsonAll = await resAll.json();
      if (!resAll.ok || !jsonAll.success) throw new Error(jsonAll.error || "Published events could not be loaded.");
      setEvents(jsonAll.data);

      try {
        const resPending = await fetch("/api/admin/events/pending", { cache: "no-store" });
        const jsonPending = await resPending.json();
        if (resPending.ok && jsonPending.success) setPendingEvents(jsonPending.data);
      } catch (error) {
        console.error("Pending events could not be loaded:", error);
      }
    } catch (error) {
      console.error("Admin events could not be loaded:", error);
      setToast({ type: "error", text: "Published events could not be loaded. Please retry." });
    }
    finally { setLoading(false); }
  };

  useEffect(() => { loadEvents(); }, []);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  /* ─── Approve Pending Event ──────────────────────────────────────────────── */
  const handleApprove = async (id: string, name: string) => {
    setActionId(id);
    try {
      const res = await fetch("/api/admin/events/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Approval failed");

      showToast("success", `Event "${name}" approved and published!`);
      loadEvents();
    } catch (err: any) {
      showToast("error", err.message || "Failed to approve event.");
    } finally {
      setActionId(null);
    }
  };

  /* ─── Reject Pending Event ──────────────────────────────────────────────── */
  const handleReject = async (id: string, name: string) => {
    const reason = window.prompt(`Reject "${name}"? Enter optional reason for submitter:`, "Does not meet calendar requirements.");
    if (reason === null) return; // user cancelled prompt

    setActionId(id);
    try {
      const res = await fetch("/api/admin/events/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, reason }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Rejection failed");

      showToast("success", `Event "${name}" rejected.`);
      loadEvents();
    } catch (err: any) {
      showToast("error", err.message || "Failed to reject event.");
    } finally {
      setActionId(null);
    }
  };

  /* ─── Modal helpers ─────────────────────────────────────────────────────── */
  const resetForm = () => {
    const today = new Date().toISOString().slice(0, 10);
    setFormName(""); setFormCategory("tournament"); setFormGame(""); setFormDescription(""); setFormStage("");
    setFormStartDate(today); setFormEndDate(today); setFormOrgName("");
    setFormOrgLogoUrl(""); setFormRegion(""); setFormDaysOfWeek([1,2,3,4,5]);
    setFormStartTime("19:00"); setFormEndTime("21:00"); setFormTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
    setFormDailyRecurring(false);
    setFormExceptions(""); setFormStreamLinks([{ label: "YouTube", url: "" }]);
    setFormDiscordUrl(""); setFormWebsiteUrl("");
  };

  const handleOpenAdd = () => {
    setEditingEvent(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (evt: CalendarEvent) => {
    setEditingEvent(evt);
    setFormName(evt.name || "");
    setFormCategory(evt.category || "tournament");
    setFormGame(evt.game || "");
    setFormDescription(evt.description || evt.location?.note || "");
    setFormStage(evt.stage || "");
    setFormStartDate(evt.startDate || "");
    setFormEndDate(evt.endDate || "");
    setFormOrgName(evt.orgName || "");
    setFormOrgLogoUrl(evt.orgLogoUrl || "");
    setFormRegion(evt.region || "");
    setFormDailyRecurring(Boolean(evt.recurrence && evt.recurrence.daysOfWeek?.length === 7 && evt.endDate === "2099-12-31"));
    if (evt.recurrence) {
      setFormDaysOfWeek(evt.recurrence.daysOfWeek || [1,2,3,4,5]);
      setFormStartTime(evt.recurrence.startTime || "19:00");
      setFormEndTime(evt.recurrence.endTime || "21:00");
      setFormTimezone(evt.recurrence.timezone || evt.location?.timezone || "UTC");
      setFormExceptions((evt.recurrence.exceptions || []).join(", "));
    } else {
      setFormDaysOfWeek([1,2,3,4,5]);
      setFormStartTime(evt.startTime || "");
      setFormEndTime(evt.endTime || "");
      setFormTimezone(evt.location?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
      setFormExceptions("");
    }
    setFormStreamLinks(evt.streamLinks?.length ? evt.streamLinks.map((stream) => ({ ...stream, label: getStreamPlatform(stream.label, stream.url).value })) : [{ label: "YouTube", url: "" }]);
    setFormDiscordUrl(evt.location?.discordUrl || "");
    setFormWebsiteUrl(evt.location?.websiteUrl || "");
    setIsModalOpen(true);
  };

  /* ─── Submit ────────────────────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formOrgName.trim() || (!formDailyRecurring && (!formStartDate || !formEndDate)) || (formDailyRecurring && !formStartTime)) {
      showToast("error", formDailyRecurring ? "Event name, Org name, and start time are required." : "Event name, Org name, and Date range are required.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<CalendarEvent> = {
        ...(editingEvent ? { id: editingEvent.id } : {}),
        name: formName.trim(),
        category: formCategory,
        game: formGame.trim() || null,
        description: formDescription.trim() || null,
        startTime: formStartTime || null,
        endTime: formEndTime || null,
        stage: formStage.trim() || null,
        startDate: formDailyRecurring ? new Date().toISOString().slice(0,10) : formStartDate,
        endDate: formDailyRecurring ? "2099-12-31" : formEndDate,
        orgName: formOrgName.trim(),
        orgLogoUrl: formOrgLogoUrl.trim() || null,
        region: formRegion.trim() || null,
        status: "approved",
        streamLinks: formStreamLinks.filter((s) => s.url.trim().length > 0),
        location: {
          discordUrl: formDiscordUrl.trim() || undefined,
          websiteUrl: formWebsiteUrl.trim() || undefined,
          note: formDescription.trim() || undefined,
          timezone: formTimezone,
        },
        recurrence: formDailyRecurring || formCategory === "scrim" ? {
          daysOfWeek: formDailyRecurring ? [0,1,2,3,4,5,6] : formDaysOfWeek,
          startTime: formStartTime,
          endTime: formEndTime || "23:59",
          timezone: formTimezone,
          exceptions: formExceptions.split(",").map((s) => s.trim()).filter(Boolean),
        } : null,
      };

      const method = editingEvent ? "PUT" : "POST";
      const res = await fetch("/api/admin/events", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Save failed");

      showToast("success", editingEvent ? "Event updated successfully!" : "Event created successfully!");
      setIsModalOpen(false);
      loadEvents();
    } catch (err: any) {
      showToast("error", err.message || "Failed to save event.");
    } finally {
      setIsSaving(false);
    }
  };

  /* ─── Delete ────────────────────────────────────────────────────────────── */
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/events?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Delete failed");

      showToast("success", "Event deleted.");
      loadEvents();
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete event.");
    }
  };

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold shadow-2xl animate-fadeIn ${
          toast.type === "success" ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-300" : "bg-red-950/90 border-red-500/40 text-red-300"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Title bar */}
        {activeTab !== "analytics" && <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display font-bold text-white text-2xl tracking-wide">Event Management</h1>
            <p className="text-xs text-[#52525b] mt-0.5">Manage published events &amp; review public booked event requests.</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button type="button" onClick={() => setIsMediaLibraryOpen(true)} className="admin-media-button"><Images />Media library</button>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-extrabold text-xs sm:text-sm shadow-lg hover:scale-[1.02] transition-transform"
              style={{ background: "#4F7CFF" }}
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              New Event
            </button>
          </div>
        </div>}

        {/* Tabs for Published vs Pending Booked Events */}
        <div className="admin-section-tabs flex items-center gap-2 mb-6 border-b border-[#27272a] pb-2">
          <button
            onClick={() => setActiveTab("published")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "published"
                ? "bg-[#4F7CFF]/10 text-[#4F7CFF] border border-[#4F7CFF]/40"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Published Events ({events.length})
          </button>
          
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative ${
              activeTab === "pending"
                ? "bg-[#4F7CFF]/10 text-[#4F7CFF] border border-[#4F7CFF]/40"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#4F7CFF]" />
            Pending Bookings
            {pendingEvents.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#4F7CFF] text-white">
                {pendingEvents.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "analytics"
                ? "bg-[#4F7CFF]/10 text-[#4F7CFF] border border-[#4F7CFF]/40"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Analytics
          </button>
        </div>

        {/* Content */}
        {activeTab === "analytics" ? (
          <AdminAnalyticsDashboard />
        ) : loading ? (
          <div className="flex items-center justify-center p-24 gap-3">
            <Loader2 className="w-5 h-5 text-[#4F7CFF] animate-spin" />
            <span className="text-sm text-[#52525b]">Loading events…</span>
          </div>
        ) : activeTab === "pending" ? (
          /* PENDING BOOKINGS VIEW */
          pendingEvents.length === 0 ? (
            <div className="p-16 text-center rounded-2xl bg-[#0a0c0b] border border-[#222624]">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/60 mx-auto mb-3" />
              <h3 className="font-display font-bold text-white text-base">No Pending Bookings</h3>
              <p className="text-xs text-[#52525b] mt-1">All public event booking requests have been reviewed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingEvents.map((evt) => (
                <div key={evt.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-[#0a0c0b] border border-[#4F7CFF]/25 hover:border-[#4F7CFF]/55 transition-colors">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <CatBadge cat={evt.category} />
                    <div className="min-w-0">
                      <div className="font-display font-bold text-white text-base truncate flex items-center gap-2">
                        {evt.name}
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#4F7CFF]/10 text-[#4F7CFF] border border-[#4F7CFF]/25">
                          PENDING APPROVAL
                        </span>
                      </div>
                      <div className="text-xs text-[#71717a] mt-1 flex items-center gap-2 flex-wrap">
                        <span className="text-white/80 font-medium">{evt.orgName}</span>
                        <span>·</span>
                        <span>{evt.startDate} – {evt.endDate}</span>
                        {evt.region && (
                          <>
                            <span>·</span>
                            <span className="text-[#4F7CFF]">{evt.region}</span>
                          </>
                        )}
                        {evt.submitterEmail && (
                          <>
                            <span>·</span>
                            <span className="text-[#4F7CFF] font-mono">Submitter: {evt.submitterEmail}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                    <button
                      onClick={() => setViewingEvent(evt)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[.04] border border-white/10 text-zinc-300 text-xs font-bold hover:text-white hover:border-white/20 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View details
                    </button>
                    <button
                      onClick={() => handleApprove(evt.id, evt.name)}
                      disabled={actionId === evt.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                    >
                      {actionId === evt.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(evt.id, evt.name)}
                      disabled={actionId === evt.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : events.length === 0 ? (
          /* PUBLISHED EVENTS VIEW EMPTY */
          <div className="p-16 text-center rounded-2xl bg-[#0a0c0b] border border-[#222624]">
            <Calendar className="w-10 h-10 text-[#3f3f46] mx-auto mb-3" />
            <h3 className="font-display font-bold text-white text-base">No Events Added Yet</h3>
            <p className="text-xs text-[#52525b] mt-1 mb-4">Click &ldquo;New Event&rdquo; to create your first event entry.</p>
            <button onClick={handleOpenAdd} className="px-4 py-2 rounded-xl text-xs font-bold text-black"
              style={{ background: "#4F7CFF" }}>
              Create Event
            </button>
          </div>
        ) : (
          /* PUBLISHED EVENTS VIEW LIST */
          <div className="space-y-3">
            {events.map((evt) => (
              <div key={evt.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#0a0c0b] border border-[#222624] hover:border-[#373d39] transition-colors">
                <div className="flex items-center gap-3.5 min-w-0">
                  <CatBadge cat={evt.category} />
                  <div className="min-w-0">
                    <div className="font-display font-bold text-white text-base truncate">{evt.name}</div>
                    <div className="text-xs text-[#71717a] mt-0.5 flex items-center gap-2 flex-wrap">
                      <span className="text-white/80 font-medium">{evt.orgName}</span>
                      <span>·</span>
                      <span>{evt.startDate} – {evt.endDate}</span>
                      {evt.region && (
                        <>
                          <span>·</span>
                          <span className="text-[#4F7CFF]">{evt.region}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => setViewingEvent(evt)}
                    className="p-2 rounded-lg bg-[#1c1c20] border border-[#27272a] text-[#a1a1aa] hover:text-white hover:border-[#3f3f46] transition-all"
                    title="View full details"
                    aria-label={`View details for ${evt.name}`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(evt)}
                    className="p-2 rounded-lg bg-[#1c1c20] border border-[#27272a] text-[#a1a1aa] hover:text-white hover:border-[#3f3f46] transition-all"
                    title="Edit event"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(evt.id, evt.name)}
                    className="p-2 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-950/60 transition-all"
                    title="Delete event"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <MediaLibraryModal open={isMediaLibraryOpen} onClose={() => setIsMediaLibraryOpen(false)} />
      <EventModal event={viewingEvent} now={new Date()} onClose={() => setViewingEvent(null)} />

      {/* Edit / Create Modal */}
      {isModalOpen && (
        <div className="drawer-backdrop admin-editor-backdrop" onClick={() => setIsModalOpen(false)}>
          <aside className="submit-drawer booking-drawer admin-editor-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="admin-editor-title">
            <header className="booking-header">
              <div className="booking-header__mark"><Calendar /></div>
              <div><span>Calendar control</span><h2 id="admin-editor-title">{editingEvent ? "Edit event" : "Create event"}</h2><p>The same listing fields and schedule controls used publicly.</p></div>
              <button onClick={() => setIsModalOpen(false)} aria-label="Close event editor"><X /></button>
            </header>

            <form onSubmit={handleSubmit} className="booking-form admin-editor-form">
              <div className="booking-form__body admin-editor-form__body">
              <section className="booking-section admin-editor-section">
                <header><span>01</span><div><h3>Event details</h3><p>What is happening and where it belongs.</p></div></header>
              <div className="booking-fields">
                <div className="booking-field booking-field--wide">
                  <span><Type />Event name <b>Required</b></span>
                  <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Season 38" className={fieldCls} />
                </div>
                <div className="booking-field">
                  <span><Gamepad2 />Game</span>
                  <SearchableSelect value={formGame} onChange={setFormGame} items={GAME_OPTIONS} placeholder="Choose a game" searchPlaceholder="Search games…" />
                </div>
                <div className="booking-field">
                  <span><Tag />Category</span>
                  <EventCategorySelect value={formCategory} onChange={setFormCategory} />
                </div>
              </div>

              <div className="booking-field booking-field--wide booking-field--textarea">
                <span><MessageSquare />Description</span>
                <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} maxLength={2000} placeholder="What players and viewers should know about this event" className={`${fieldCls} min-h-24 resize-y`} />
              </div>
              </section>

              <section className="booking-section admin-editor-section">
                <header><span>02</span><div><h3>Organizer &amp; schedule</h3><p>Who owns it and when it runs.</p></div></header>
              <div className="booking-fields">
                <div className="booking-field booking-field--wide">
                  <span><Building2 />Organization <b>Required</b></span>
                  <input type="text" required value={formOrgName} onChange={(e) => setFormOrgName(e.target.value)} placeholder="e.g. Global Apex League" className={fieldCls} />
                </div>
                <div className="booking-field booking-field--wide"><LogoUploadInput
                  label="Organization logo"
                  value={formOrgLogoUrl}
                  onChange={setFormOrgLogoUrl}
                  adminMedia
                /></div>
              </div>

              <button type="button" onClick={()=>setFormDailyRecurring(value=>!value)} className={`booking-recurrence booking-field--wide ${formDailyRecurring ? "is-active" : ""}`}>
                <span className="w-9 h-9 grid place-items-center rounded-lg bg-[#171b18]"><Repeat2 className="w-4 h-4 text-[#4F7CFF]" /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-white">Runs every day</strong><small className="block mt-0.5 text-xs text-zinc-500">{formDailyRecurring ? "Daily recurrence enabled — dates are not required" : "For daily scrims and repeating sessions"}</small></span><span className={`w-9 h-5 p-0.5 rounded-full transition-colors ${formDailyRecurring ? "bg-[#4F7CFF]" : "bg-[#282d29]"}`}><i className={`block w-4 h-4 rounded-full bg-white transition-transform ${formDailyRecurring ? "translate-x-4" : ""}`} /></span>
              </button>

              {!formDailyRecurring&&<div className="booking-fields">
                {!formDailyRecurring&&<div className="booking-field">
                  <span><CalendarDays />Start date <b>Required</b></span>
                  <DatePicker value={formStartDate} onChange={setFormStartDate} />
                </div>}
                {!formDailyRecurring&&<div className="booking-field">
                  <span><Clock3 />End date <b>Required</b></span>
                  <DatePicker value={formEndDate} onChange={setFormEndDate} min={formStartDate} />
                </div>}
              </div>}

              <div className="booking-fields">
                <div className="booking-field">
                  <span><MapPin />Region</span>
                  <SearchableSelect value={formRegion} onChange={setFormRegion} items={REGION_OPTIONS} placeholder="Choose a region" searchPlaceholder="Search regions…" />
                </div>
                <div className="booking-field">
                  <span><Clock3 />Timezone</span>
                  <SearchableSelect value={formTimezone} onChange={setFormTimezone} items={timezoneOptions} placeholder="Choose a timezone" searchPlaceholder="Search timezones…" align="right" />
                </div>
              </div>

              <div className="booking-fields">
                <div className="booking-field"><span><Clock3 />Start time</span><TimePicker value={formStartTime} onChange={setFormStartTime} placeholder="Choose start time" /></div>
                <div className="booking-field"><span><Clock3 />End time <small>Optional</small></span><TimePicker value={formEndTime} onChange={setFormEndTime} placeholder="No end time" optional align="right" /></div>
              </div>

              {formCategory === "scrim" && !formDailyRecurring && (
                <div className="p-4 rounded-xl bg-[#070908] border border-[#222624] space-y-3">
                  <div className="text-xs font-bold text-[#4F7CFF] uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Scrim Schedule Recurrence
                  </div>
                  <div>
                    <label className={labelCls}>Days of Week</label>
                    <div className="flex flex-wrap gap-1.5">
                      {DAYS.map((d) => {
                        const checked = formDaysOfWeek.includes(d.val);
                        return (
                          <button key={d.val} type="button" onClick={() => setFormDaysOfWeek((prev) => checked ? prev.filter((x) => x !== d.val) : [...prev, d.val])}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${checked ? "bg-[#4F7CFF] text-white" : "bg-[#111412] border border-[#222624] text-[#69736c]"}`}>
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              </section>

              <section className="booking-section admin-editor-section">
                <header><span>03</span><div><h3>Links &amp; broadcast</h3><p>Give people somewhere useful to go.</p></div></header>
              <div className="booking-streams">
                <div className="booking-streams__head"><span>Stream links</span><button type="button" onClick={() => setFormStreamLinks((current) => [...current, { label: "YouTube", url: "" }])}><Plus />Add stream</button></div>
                {formStreamLinks.map((stream,index)=><div className="booking-stream" key={index}>
                  <SearchableSelect value={stream.label || ""} onChange={(value)=>setFormStreamLinks((current)=>current.map((item,itemIndex)=>itemIndex===index?{...item,label:value}:item))} items={STREAM_OPTIONS} placeholder="Platform" searchPlaceholder="Search platforms…" />
                  <input type="url" className={fieldCls} value={stream.url} onChange={(event)=>setFormStreamLinks((current)=>current.map((item,itemIndex)=>itemIndex===index?{...item,url:event.target.value}:item))} placeholder="Paste the full stream URL" />
                  {formStreamLinks.length>1&&<button type="button" onClick={()=>setFormStreamLinks((current)=>current.filter((_,itemIndex)=>itemIndex!==index))} aria-label="Remove stream"><Trash2 /></button>}
                </div>)}
              </div>

              <div className="booking-fields">
                <div className="booking-field">
                  <span><MessageSquare />Discord invite</span>
                  <input type="url" value={formDiscordUrl} onChange={(e) => setFormDiscordUrl(e.target.value)} placeholder="https://discord.gg/..." className={fieldCls} />
                </div>
                <div className="booking-field">
                  <span><Globe2 />Event website</span>
                  <input type="url" value={formWebsiteUrl} onChange={(e) => setFormWebsiteUrl(e.target.value)} placeholder="https://..." className={fieldCls} />
                </div>
              </div>
              </section>
              </div>

              <footer className="booking-footer admin-editor-footer">
                <p><ShieldCheck /> Admin changes publish immediately.</p>
                <div>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl bg-[#1c1c20] border border-[#27272a] text-[#a1a1aa] text-sm font-semibold hover:text-white transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-5 py-2 rounded-lg text-white text-sm font-extrabold transition-colors disabled:opacity-50" style={{ background: "#4F7CFF" }}>
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingEvent ? "Save Changes" : "Publish Event"}
                </button>
                </div>
              </footer>
            </form>
          </aside>
        </div>
      )}
    </>
  );
}

/* ─── Main Admin Page export ─────────────────────────────────────────────── */
export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col bg-[#050606] text-zinc-100 items-center justify-center p-24 gap-3">
        <Loader2 className="w-6 h-6 text-[#4F7CFF] animate-spin" />
        <span className="text-sm text-[#52525b]">Loading Admin Portal…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#050606] text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#222624] bg-[#050606]/95 backdrop-blur-xl">
        <div className="h-[2px] w-full bg-[#4F7CFF]" />
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-[#71717a] hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Calendar
          </Link>
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#4F7CFF]" />
            <span className="font-display font-bold text-white text-xs uppercase tracking-wider">Admin Portal</span>
          </div>
          <ClerkHeaderAuth />
        </div>
      </header>

      {/* Main Auth View */}
      <div className="flex-1">
        <Show when="signed-out">
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="mb-6 text-center max-w-md">
              <div className="w-12 h-12 rounded-xl bg-[#4F7CFF]/10 border border-[#4F7CFF]/30 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6 text-[#4F7CFF]" />
              </div>
              <h2 className="font-display font-bold text-white text-2xl tracking-wide">
                Admin Portal Sign In
              </h2>
              <p className="text-xs text-[#71717a] mt-1 leading-relaxed">
                Sign in to manage the global esports calendar. Only authorized administrator emails will be granted permission.
              </p>
            </div>

            <div className="match-dialog p-6">
              <SignIn
                routing="hash"
                forceRedirectUrl="/admin"
                signUpUrl="/admin"
              />
            </div>
          </div>
        </Show>

        <Show when="signed-in">
          <AdminContent />
        </Show>
      </div>
    </div>
  );
}
