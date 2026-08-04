"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, SignIn, UserButton, useUser, useClerk } from "@clerk/nextjs";
import {
  Plus, Edit2, Trash2, Calendar, ArrowLeft,
  Loader2, CheckCircle2, AlertCircle, X, Clock, Globe, ShieldAlert, Lock, LogOut, MessageSquare,
} from "lucide-react";
import { CalendarEvent, EventCategory, ScrimRecurrence, StreamLink } from "@/types/event";
import { isAuthorizedAdminEmail } from "@/lib/adminPermissions";
import { LogoUploadInput } from "@/components/LogoUploadInput";

/* ─── Header Auth Component ────────────────────────────────────────────────── */
function ClerkHeaderAuth() {
  const { user } = useUser();
  const { signOut } = useClerk();
  return (
    <SignedIn>
      <div className="flex items-center gap-3">
        <span className="text-xs text-[#71717a] hidden sm:block">
          {user?.primaryEmailAddress?.emailAddress || user?.fullName}
        </span>
        <UserButton afterSignOutUrl="/admin" />
        <button
          onClick={() => signOut()}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Log Out</span>
        </button>
      </div>
    </SignedIn>
  );
}

/* ─── Input / label atoms ────────────────────────────────────────────────── */
const fieldCls = "w-full liquid-glass-input rounded-xl px-3.5 py-2 text-sm text-white outline-none placeholder-zinc-500 transition-all";
const labelCls = "block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5";

/* ─── Category colours ───────────────────────────────────────────────────── */
const CAT_META: Record<EventCategory, { label: string; ring: string; bg: string; text: string }> = {
  ranking:    { label: "Ranking",    ring: "border-amber-500",  bg: "bg-amber-500/10",  text: "text-amber-300" },
  tournament: { label: "Tournament", ring: "border-cyan-500",   bg: "bg-cyan-500/10",   text: "text-cyan-300" },
  scrim:      { label: "Scrim",      ring: "border-emerald-500",bg: "bg-emerald-500/10",text: "text-emerald-300" },
  award:      { label: "Award",      ring: "border-purple-500", bg: "bg-purple-500/10", text: "text-purple-300" },
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
  const [activeTab, setActiveTab] = useState<"published" | "pending">("published");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [pendingEvents, setPendingEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  /* Form fields */
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<EventCategory>("tournament");
  const [formGame, setFormGame] = useState("");
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
      const [resAll, resPending] = await Promise.all([
        fetch("/api/events", { cache: "no-store" }),
        fetch("/api/admin/events/pending", { cache: "no-store" }),
      ]);
      const jsonAll = await resAll.json();
      const jsonPending = await resPending.json();

      if (jsonAll.success) setEvents(jsonAll.data);
      if (jsonPending.success) setPendingEvents(jsonPending.data);
    } catch { /* silent */ }
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
    setFormName(""); setFormCategory("tournament"); setFormGame(""); setFormStage("");
    setFormStartDate(today); setFormEndDate(today); setFormOrgName("");
    setFormOrgLogoUrl(""); setFormRegion(""); setFormDaysOfWeek([1,2,3,4,5]);
    setFormStartTime("19:00"); setFormEndTime("21:00"); setFormTimezone("Africa/Lagos");
    setFormExceptions(""); setFormStreamLinks([{ label: "Main Stream", url: "" }]);
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
    setFormStage(evt.stage || "");
    setFormStartDate(evt.startDate || "");
    setFormEndDate(evt.endDate || "");
    setFormOrgName(evt.orgName || "");
    setFormOrgLogoUrl(evt.orgLogoUrl || "");
    setFormRegion(evt.region || "");
    if (evt.recurrence) {
      setFormDaysOfWeek(evt.recurrence.daysOfWeek || [1,2,3,4,5]);
      setFormStartTime(evt.recurrence.startTime || "19:00");
      setFormEndTime(evt.recurrence.endTime || "21:00");
      setFormTimezone(evt.recurrence.timezone || "Africa/Lagos");
      setFormExceptions((evt.recurrence.exceptions || []).join(", "));
    } else {
      setFormDaysOfWeek([1,2,3,4,5]);
      setFormStartTime("19:00");
      setFormEndTime("21:00");
      setFormTimezone("Africa/Lagos");
      setFormExceptions("");
    }
    setFormStreamLinks(evt.streamLinks?.length ? evt.streamLinks : [{ label: "Main Stream", url: "" }]);
    setFormDiscordUrl(evt.location?.discordUrl || "");
    setFormWebsiteUrl(evt.location?.websiteUrl || "");
    setIsModalOpen(true);
  };

  /* ─── Submit ────────────────────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formOrgName.trim() || !formStartDate || !formEndDate) {
      showToast("error", "Event name, Org name, and Date range are required.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<CalendarEvent> = {
        ...(editingEvent ? { id: editingEvent.id } : {}),
        name: formName.trim(),
        category: formCategory,
        game: formGame.trim() || null,
        stage: formStage.trim() || null,
        startDate: formStartDate,
        endDate: formEndDate,
        orgName: formOrgName.trim(),
        orgLogoUrl: formOrgLogoUrl.trim() || null,
        region: formRegion.trim() || null,
        status: "approved",
        streamLinks: formStreamLinks.filter((s) => s.url.trim().length > 0),
        location: {
          discordUrl: formDiscordUrl.trim() || undefined,
          websiteUrl: formWebsiteUrl.trim() || undefined,
        },
        recurrence: formCategory === "scrim" ? {
          daysOfWeek: formDaysOfWeek,
          startTime: formStartTime,
          endTime: formEndTime,
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

  const handleMigrateSupabase = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/migrate-supabase", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Migration failed");
      showToast("success", json.message || "Events synced to Supabase successfully!");
      loadEvents();
    } catch (err: any) {
      showToast("error", err.message || "Failed to sync to Supabase.");
    } finally {
      setIsSaving(false);
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display font-bold text-white text-2xl tracking-wide">Event Management</h1>
            <p className="text-xs text-[#52525b] mt-0.5">Manage published events &amp; review public booked event requests.</p>
          </div>
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={handleMigrateSupabase}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 text-xs font-bold transition-all disabled:opacity-50"
              title="Sync all pre-existing events from data/events.json into Supabase"
            >
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              Sync Events to Supabase
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-black font-extrabold text-xs sm:text-sm shadow-lg hover:scale-[1.02] transition-transform"
              style={{ background: "linear-gradient(135deg,#e8a33d,#c9821f)" }}
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              New Event
            </button>
          </div>
        </div>

        {/* Tabs for Published vs Pending Booked Events */}
        <div className="flex items-center gap-2 mb-6 border-b border-[#27272a] pb-2">
          <button
            onClick={() => setActiveTab("published")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "published"
                ? "bg-[#1c1c20] text-amber-400 border border-amber-500/30 shadow-lg"
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
                ? "bg-[#1c1c20] text-amber-400 border border-amber-500/30 shadow-lg"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Pending Bookings
            {pendingEvents.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-black animate-pulse">
                {pendingEvents.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center p-24 gap-3">
            <Loader2 className="w-5 h-5 text-[#e8a33d] animate-spin" />
            <span className="text-sm text-[#52525b]">Loading events…</span>
          </div>
        ) : activeTab === "pending" ? (
          /* PENDING BOOKINGS VIEW */
          pendingEvents.length === 0 ? (
            <div className="p-16 text-center rounded-2xl bg-[#111113] border border-[#27272a]">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/60 mx-auto mb-3" />
              <h3 className="font-display font-bold text-white text-base">No Pending Bookings</h3>
              <p className="text-xs text-[#52525b] mt-1">All public event booking requests have been reviewed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingEvents.map((evt) => (
                <div key={evt.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-[#141417] border border-amber-500/20 hover:border-amber-500/40 transition-colors">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <CatBadge cat={evt.category} />
                    <div className="min-w-0">
                      <div className="font-display font-bold text-white text-base truncate flex items-center gap-2">
                        {evt.name}
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/25">
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
                            <span className="text-[#e8a33d]">{evt.region}</span>
                          </>
                        )}
                        {evt.submitterEmail && (
                          <>
                            <span>·</span>
                            <span className="text-cyan-400 font-mono">Submitter: {evt.submitterEmail}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
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
          <div className="p-16 text-center rounded-2xl bg-[#111113] border border-[#27272a]">
            <Calendar className="w-10 h-10 text-[#3f3f46] mx-auto mb-3" />
            <h3 className="font-display font-bold text-white text-base">No Events Added Yet</h3>
            <p className="text-xs text-[#52525b] mt-1 mb-4">Click &ldquo;New Event&rdquo; to create your first event entry.</p>
            <button onClick={handleOpenAdd} className="px-4 py-2 rounded-xl text-xs font-bold text-black"
              style={{ background: "linear-gradient(135deg,#e8a33d,#c9821f)" }}>
              Create Event
            </button>
          </div>
        ) : (
          /* PUBLISHED EVENTS VIEW LIST */
          <div className="space-y-3">
            {events.map((evt) => (
              <div key={evt.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#141417] border border-[#27272a] hover:border-[#3f3f46] transition-colors">
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
                          <span className="text-[#e8a33d]">{evt.region}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
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

      {/* Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" onClick={() => setIsModalOpen(false)}>
          <div className="relative w-full max-w-2xl bg-[#141417] border border-[#27272a] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1e]">
              <h3 className="font-display font-bold text-white text-lg">
                {editingEvent ? "Edit Event" : "Create New Event"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#52525b] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Event Name *</label>
                  <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Season 38" className={fieldCls} />
                </div>
                <div>
                  <label className={labelCls}>Game Title</label>
                  <input type="text" value={formGame} onChange={(e) => setFormGame(e.target.value)} placeholder="e.g. Apex Legends, Free Fire" className={fieldCls} />
                </div>
                <div>
                  <label className={labelCls}>Category *</label>
                  <select value={formCategory} onChange={(e) => setFormCategory(e.target.value as EventCategory)} className={fieldCls}>
                    <option value="tournament">Tournament</option>
                    <option value="ranking">Ranking Ladder</option>
                    <option value="scrim">Scrim Schedule</option>
                    <option value="award">Award Ceremony</option>
                    <option value="podcast">Podcast / Talk Show</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Organization Name *</label>
                  <input type="text" required value={formOrgName} onChange={(e) => setFormOrgName(e.target.value)} placeholder="e.g. African Battle Royale Community" className={fieldCls} />
                </div>
                <LogoUploadInput
                  label="Org Logo (Upload or URL)"
                  value={formOrgLogoUrl}
                  onChange={setFormOrgLogoUrl}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Start Date *</label>
                  <input type="date" required value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} className={fieldCls} />
                </div>
                <div>
                  <label className={labelCls}>End Date *</label>
                  <input type="date" required value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} className={fieldCls} />
                </div>
                <div>
                  <label className={labelCls}>Region</label>
                  <input type="text" value={formRegion} onChange={(e) => setFormRegion(e.target.value)} placeholder="e.g. Sub Saharan Africa" className={fieldCls} />
                </div>
              </div>

              {formCategory === "scrim" && (
                <div className="p-4 rounded-xl bg-[#0e0e10] border border-[#27272a] space-y-3">
                  <div className="text-xs font-bold text-[#e8a33d] uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Scrim Schedule Recurrence
                  </div>
                  <div>
                    <label className={labelCls}>Days of Week</label>
                    <div className="flex flex-wrap gap-1.5">
                      {DAYS.map((d) => {
                        const checked = formDaysOfWeek.includes(d.val);
                        return (
                          <button key={d.val} type="button" onClick={() => setFormDaysOfWeek((prev) => checked ? prev.filter((x) => x !== d.val) : [...prev, d.val])}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${checked ? "bg-[#e8a33d] text-black" : "bg-[#1c1c20] border border-[#27272a] text-[#52525b]"}`}>
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Start Time</label>
                      <input type="time" value={formStartTime} onChange={(e) => setFormStartTime(e.target.value)} className={fieldCls} />
                    </div>
                    <div>
                      <label className={labelCls}>End Time</label>
                      <input type="time" value={formEndTime} onChange={(e) => setFormEndTime(e.target.value)} className={fieldCls} />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}><MessageSquare className="inline w-3 h-3 mr-1" />Discord Invite URL</label>
                  <input type="url" value={formDiscordUrl} onChange={(e) => setFormDiscordUrl(e.target.value)} placeholder="https://discord.gg/..." className={fieldCls} />
                </div>
                <div>
                  <label className={labelCls}><Globe className="inline w-3 h-3 mr-1" />Website URL</label>
                  <input type="url" value={formWebsiteUrl} onChange={(e) => setFormWebsiteUrl(e.target.value)} placeholder="https://..." className={fieldCls} />
                </div>
              </div>

              <div className="pt-4 border-t border-[#1a1a1e] flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl bg-[#1c1c20] border border-[#27272a] text-[#a1a1aa] text-sm font-semibold hover:text-white transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-5 py-2 rounded-xl text-black text-sm font-extrabold shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50" style={{ background: "linear-gradient(135deg,#e8a33d,#c9821f)" }}>
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingEvent ? "Save Changes" : "Publish Event"}
                </button>
              </div>
            </form>
          </div>
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
      <div className="min-h-screen flex flex-col bg-[#0a0a0c] text-zinc-100 items-center justify-center p-24 gap-3">
        <Loader2 className="w-6 h-6 text-[#e8a33d] animate-spin" />
        <span className="text-sm text-[#52525b]">Loading Admin Portal…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0c] text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#27272a] bg-[#0a0a0c]/95 backdrop-blur-xl">
        <div className="h-[2px] w-full" style={{ background: "linear-gradient(90deg,#e8a33d,#c9821f)" }} />
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-[#71717a] hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Calendar
          </Link>
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#e8a33d]" />
            <span className="font-display font-bold text-white text-xs uppercase tracking-wider">Admin Portal</span>
          </div>
          <ClerkHeaderAuth />
        </div>
      </header>

      {/* Main Auth View */}
      <div className="flex-1">
        <SignedOut>
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="mb-6 text-center max-w-md">
              <div className="w-12 h-12 rounded-2xl bg-[#e8a33d]/10 border border-[#e8a33d]/30 flex items-center justify-center mx-auto mb-3 shadow-xl">
                <Lock className="w-6 h-6 text-[#e8a33d]" />
              </div>
              <h2 className="font-display font-bold text-white text-2xl tracking-wide">
                Admin Portal Sign In
              </h2>
              <p className="text-xs text-[#71717a] mt-1 leading-relaxed">
                Sign in to manage Africa BR Calendar events. Only authorized administrator emails will be granted permission.
              </p>
            </div>

            <div className="liquid-glass-card p-6 rounded-3xl border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.8)]">
              <SignIn
                routing="hash"
                afterSignInUrl="/admin"
                afterSignUpUrl="/admin"
                signUpUrl="/admin"
              />
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          <AdminContent />
        </SignedIn>
      </div>
    </div>
  );
}
