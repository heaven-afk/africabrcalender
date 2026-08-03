"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser, useClerk } from "@clerk/nextjs";
import {
  Plus, Edit2, Trash2, Calendar, ArrowLeft,
  Loader2, CheckCircle2, AlertCircle, X, Clock, Globe, Tv, ShieldAlert, Lock, LogOut, MessageSquare,
} from "lucide-react";
import { CalendarEvent, EventCategory, ScrimRecurrence, StreamLink } from "@/types/event";
import { isAuthorizedAdminEmail } from "@/lib/adminPermissions";
import { isValidClerkPublishableKey } from "@/lib/clerkUtils";

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
            <button className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-black shadow-md hover:scale-[1.02] transition-transform"
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

/* ─── Admin Content (Secured) ────────────────────────────────────────────── */
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
          Access Restricted
        </h2>
        <p className="text-sm text-[#71717a] max-w-md mb-6 leading-relaxed">
          Your account (<span className="text-white font-semibold">{userEmail || "Signed In"}</span>) is not authorized to access the Admin Management Portal.
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
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}

/* ─── Main Admin Dashboard Component ────────────────────────────────────── */
function AdminDashboard() {
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
        stage: formStage.trim() || null,
        startDate: formStartDate,
        endDate: formEndDate,
        orgName: formOrgName.trim(),
        orgLogoUrl: formOrgLogoUrl.trim() || null,
        region: formRegion.trim() || null,
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
      setEvents((prev) => prev.filter((e) => e.id !== id));
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-white text-2xl tracking-wide">Event Management</h1>
            <p className="text-xs text-[#52525b] mt-0.5">Add, update, or remove tournaments, ranking ladders &amp; scrim schedules.</p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-black font-extrabold text-sm shadow-lg hover:scale-[1.02] transition-transform self-start sm:self-auto"
            style={{ background: "linear-gradient(135deg,#e8a33d,#c9821f)" }}
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            New Event
          </button>
        </div>

        {/* Events Table / Cards */}
        {loading ? (
          <div className="flex items-center justify-center p-24 gap-3">
            <Loader2 className="w-5 h-5 text-[#e8a33d] animate-spin" />
            <span className="text-sm text-[#52525b]">Loading events…</span>
          </div>
        ) : events.length === 0 ? (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Event Name *</label>
                  <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Season 38 / Nova Scrims" className={fieldCls} />
                </div>
                <div>
                  <label className={labelCls}>Category *</label>
                  <select value={formCategory} onChange={(e) => setFormCategory(e.target.value as EventCategory)} className={fieldCls}>
                    <option value="tournament">Tournament</option>
                    <option value="ranking">Ranking Ladder</option>
                    <option value="scrim">Scrim Schedule</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Organization Name *</label>
                  <input type="text" required value={formOrgName} onChange={(e) => setFormOrgName(e.target.value)} placeholder="e.g. African Battle Royale Community" className={fieldCls} />
                </div>
                <div>
                  <label className={labelCls}>Org Logo URL</label>
                  <input type="url" value={formOrgLogoUrl} onChange={(e) => setFormOrgLogoUrl(e.target.value)} placeholder="https://i.ibb.co/..." className={fieldCls} />
                </div>
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

function AdminAuthWrapper() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center p-24 gap-3">
        <Loader2 className="w-5 h-5 text-[#e8a33d] animate-spin" />
        <span className="text-sm text-[#52525b]">Loading auth…</span>
      </div>
    );
  }

  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const isValidClerkKey = isValidClerkPublishableKey(publishableKey);

  if (!isValidClerkKey) {
    return <AdminDashboard />;
  }

  return (
    <>
      <SignedOut>
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#e8a33d]/10 border border-[#e8a33d]/30 flex items-center justify-center mb-4 shadow-xl">
            <Lock className="w-8 h-8 text-[#e8a33d]" />
          </div>
          <h2 className="font-display font-bold text-white text-2xl tracking-wide mb-2">
            Admin Authentication Required
          </h2>
          <p className="text-sm text-[#71717a] max-w-sm mb-6 leading-relaxed">
            Sign in with an authorized administrator account to add, edit, or remove events on the Africa BR Calendar.
          </p>
          <SignInButton mode="modal">
            <button className="px-6 py-2.5 rounded-xl text-sm font-extrabold text-black shadow-xl hover:scale-[1.03] transition-transform"
              style={{ background: "linear-gradient(135deg,#e8a33d,#c9821f)" }}>
              Sign In to Admin Portal
            </button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        <AdminContent />
      </SignedIn>
    </>
  );
}

/* ─── Main Admin Page export ─────────────────────────────────────────────── */
export default function AdminPage() {
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
        <AdminAuthWrapper />
      </div>
    </div>
  );
}
