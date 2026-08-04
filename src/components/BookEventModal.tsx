"use client";

import React, { useState } from "react";
import { X, Calendar, Mail, Globe, MessageSquare, Plus, Trash2, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { EventCategory, StreamLink } from "@/types/event";

interface BookEventModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const fieldCls = "w-full liquid-glass-input rounded-xl px-3.5 py-2 text-sm text-white outline-none placeholder-zinc-500 transition-all";
const labelCls = "block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5";

export const BookEventModal: React.FC<BookEventModalProps> = ({ open, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<EventCategory>("tournament");
  const [stage, setStage] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgLogoUrl, setOrgLogoUrl] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [region, setRegion] = useState("");
  const [streamLinks, setStreamLinks] = useState<StreamLink[]>([{ label: "Main Stream", url: "" }]);
  const [discordUrl, setDiscordUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !orgName.trim() || !submitterEmail.trim() || !startDate || !endDate) {
      setError("Please fill in Event Name, Org Name, Your Email, and Dates.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        category,
        stage: stage.trim() || undefined,
        orgName: orgName.trim(),
        orgLogoUrl: orgLogoUrl.trim() || undefined,
        submitterEmail: submitterEmail.trim(),
        startDate,
        endDate,
        region: region.trim() || undefined,
        streamLinks: streamLinks.filter((s) => s.url.trim().length > 0),
        location: {
          discordUrl: discordUrl.trim() || undefined,
          websiteUrl: websiteUrl.trim() || undefined,
        },
      };

      const res = await fetch("/api/events/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to submit event booking");
      }

      setSuccessMsg(json.message || "Your event has been submitted! It will appear on the calendar once approved.");
      if (onSuccess) onSuccess();

      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 2500);
    } catch (err: any) {
      setError(err.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cmd-backdrop animate-fadeIn" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl bg-[#101015]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scaleIn my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-amber-500/[0.03]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-lg tracking-wide flex items-center gap-2">
                Book / Schedule an Event
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-xs text-zinc-400">
                Submit your tournament, scrim, or talk show for public calendar approval.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {successMsg ? (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-bounce" />
            </div>
            <h4 className="font-display font-bold text-white text-xl">Booking Submitted!</h4>
            <p className="text-sm text-zinc-300 max-w-md leading-relaxed">{successMsg}</p>
            <p className="text-xs text-amber-400/80 font-medium">You will receive an email confirmation once approved.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs font-semibold text-red-300">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Event Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sub-Saharan Championship 2026"
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls}>Event Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EventCategory)}
                  className={fieldCls}
                >
                  <option value="tournament" className="bg-[#121216]">Tournament</option>
                  <option value="ranking" className="bg-[#121216]">Ranking Ladder</option>
                  <option value="scrim" className="bg-[#121216]">Scrim Schedule</option>
                  <option value="award" className="bg-[#121216]">Award Ceremony</option>
                  <option value="podcast" className="bg-[#121216]">Podcast / Talk Show</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Organization Name *</label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Apex Africa Community"
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls}><Mail className="inline w-3 h-3 mr-1 text-amber-400" />Your Email (For Notifications) *</label>
                <input
                  type="email"
                  required
                  value={submitterEmail}
                  onChange={(e) => setSubmitterEmail(e.target.value)}
                  placeholder="organizer@domain.com"
                  className={fieldCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Start Date *</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls}>End Date *</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls}>Region</label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="e.g. West Africa"
                  className={fieldCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Org Logo Image URL</label>
                <input
                  type="url"
                  value={orgLogoUrl}
                  onChange={(e) => setOrgLogoUrl(e.target.value)}
                  placeholder="https://i.imgur.com/..."
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls}>Stage / Qualifier Info</label>
                <input
                  type="text"
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  placeholder="e.g. Grand Finals"
                  className={fieldCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}><MessageSquare className="inline w-3 h-3 mr-1 text-indigo-400" />Discord Invite Link</label>
                <input
                  type="url"
                  value={discordUrl}
                  onChange={(e) => setDiscordUrl(e.target.value)}
                  placeholder="https://discord.gg/..."
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls}><Globe className="inline w-3 h-3 mr-1 text-cyan-400" />Website URL</label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://..."
                  className={fieldCls}
                />
              </div>
            </div>

            {/* Stream Links */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls}>Stream Links</label>
                <button
                  type="button"
                  onClick={() => setStreamLinks([...streamLinks, { label: "Live Stream", url: "" }])}
                  className="text-[10px] font-bold text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Link
                </button>
              </div>
              {streamLinks.map((s, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Label (e.g. Twitch Main)"
                    value={s.label || ""}
                    onChange={(e) => {
                      const next = [...streamLinks];
                      next[idx].label = e.target.value;
                      setStreamLinks(next);
                    }}
                    className="w-1/3 liquid-glass-input rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                  />
                  <input
                    type="url"
                    placeholder="https://twitch.tv/..."
                    value={s.url}
                    onChange={(e) => {
                      const next = [...streamLinks];
                      next[idx].url = e.target.value;
                      setStreamLinks(next);
                    }}
                    className="flex-1 liquid-glass-input rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                  />
                  {streamLinks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setStreamLinks(streamLinks.filter((_, i) => i !== idx))}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Footer buttons */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-300 text-xs font-semibold hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-black text-xs font-extrabold shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                Submit Event Booking
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
