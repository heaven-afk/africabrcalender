"use client";

import React, { useMemo, useState } from "react";
import {
  AlertCircle, Building2, CalendarDays, CheckCircle2, Clock3,
  Gamepad2, Globe2, Layers3, Loader2, Mail, MapPin, MessageSquare,
  Plus, Radio, Repeat2, Send, ShieldCheck, Tag, Trash2, Type, X,
} from "lucide-react";
import { EventCategory, StreamLink } from "@/types/event";
import { LogoUploadInput } from "./LogoUploadInput";
import { DatePicker } from "./DatePicker";
import { SearchableSelect } from "./SearchableSelect";
import { GAME_OPTIONS, REGION_OPTIONS, STREAM_OPTIONS, TIMEZONE_OPTIONS } from "@/lib/eventCatalog";
import { TimePicker } from "./TimePicker";
import { EventCategorySelect } from "./EventCategorySelect";
import { trackAnalyticsEvent } from "@/lib/analytics-client";

interface BookEventModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BookEventModal: React.FC<BookEventModalProps> = ({ open, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<EventCategory>("tournament");
  const [game, setGame] = useState("");
  const [description, setDescription] = useState("");
  const [stage, setStage] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgLogoUrl, setOrgLogoUrl] = useState("");
  const [orgLogoFile, setOrgLogoFile] = useState<File | null>(null);
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [timezone, setTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [dailyRecurring, setDailyRecurring] = useState(false);
  const [region, setRegion] = useState("");
  const [streamLinks, setStreamLinks] = useState<StreamLink[]>([{ label: "YouTube", url: "" }]);
  const [discordUrl, setDiscordUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const timezoneOptions = useMemo(() => TIMEZONE_OPTIONS.some((item) => item.value === timezone) ? TIMEZONE_OPTIONS : [{ value: timezone, label: timezone, description: "Local timezone", icon: Clock3 }, ...TIMEZONE_OPTIONS], [timezone]);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!name.trim() || !orgName.trim() || !submitterEmail.trim() || (!dailyRecurring && (!startDate || !endDate)) || (dailyRecurring && !startTime)) {
      setError(dailyRecurring ? "Add the event name, organization, contact email and a start time." : "Add the event name, organization, contact email and dates to continue.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
          name: name.trim(), category, game: game.trim() || undefined, description: description.trim() || undefined,
          stage: stage.trim() || undefined, orgName: orgName.trim(),
          orgLogoUrl: orgLogoUrl.trim() || undefined,
          submitterEmail: submitterEmail.trim(), startDate: dailyRecurring ? today : startDate, endDate: dailyRecurring ? "2099-12-31" : endDate, startTime: startTime || undefined, endTime: endTime || undefined,
          recurrence: dailyRecurring ? { daysOfWeek: [0,1,2,3,4,5,6], startTime, endTime: endTime || "23:59", timezone, exceptions: [] } : undefined,
          region: region.trim() || undefined,
          streamLinks: streamLinks.filter((stream) => stream.url.trim()),
          location: {
            discordUrl: discordUrl.trim() || undefined,
            websiteUrl: websiteUrl.trim() || undefined,
            timezone,
          },
        };
      const formData = new FormData();
      formData.append("payload", JSON.stringify(payload));
      if (orgLogoFile) formData.append("logo", orgLogoFile);
      const response = await fetch("/api/events/book", {
        method: "POST",
        body: formData,
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || "Event submission failed");
      trackAnalyticsEvent("public_submission", { category, game: game || null, region: region || null });
      setSuccessMsg(json.message || "Your event was submitted and is ready for review.");
      onSuccess?.();
      window.setTimeout(() => { setSuccessMsg(null); onClose(); }, 2500);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStream = (index: number, key: keyof StreamLink, value: string) => {
    setStreamLinks((current) => current.map((stream, streamIndex) => streamIndex === index ? { ...stream, [key]: value } : stream));
  };

  return (
    <div className="drawer-backdrop booking-backdrop" onClick={onClose}>
      <section className="submit-drawer booking-drawer" onClick={(event) => event.stopPropagation()} aria-modal="true" role="dialog" aria-labelledby="booking-title">
        <header className="booking-header">
          <div className="booking-header__mark"><CalendarDays /></div>
          <div><span>Community listing</span><h2 id="booking-title">Add an event</h2><p>Share the essentials. We’ll review it before it goes live.</p></div>
          <button type="button" onClick={onClose} aria-label="Close add event form"><X /></button>
        </header>

        {successMsg ? (
          <div className="booking-success"><span><CheckCircle2 /></span><h3>Event received</h3><p>{successMsg}</p><small><ShieldCheck /> You’ll be notified after review.</small></div>
        ) : (
          <form onSubmit={handleSubmit} className="booking-form">
            <div className="booking-form__body">
              {error && <div className="booking-error" role="alert"><AlertCircle /><span>{error}</span></div>}

              <section className="booking-section">
                <header><span>01</span><div><h3>Event details</h3><p>What is happening and where it belongs.</p></div></header>
                <div className="booking-fields">
                  <label className="booking-field booking-field--wide"><span><Type />Event name <b>Required</b></span><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Global Championship 2026" /></label>
                  <div className="booking-field"><span><Gamepad2 />Game</span><SearchableSelect value={game} onChange={setGame} items={GAME_OPTIONS} placeholder="Choose a game" searchPlaceholder="Search popular games…" emptyLabel="No game found" /></div>
                  <div className="booking-field"><span><Tag />Category</span><EventCategorySelect value={category} onChange={setCategory} /></div>
                  <label className="booking-field booking-field--wide"><span><Layers3 />Stage or qualifier</span><input value={stage} onChange={(e) => setStage(e.target.value)} placeholder="Optional — e.g. Grand finals" /></label>
                  <label className="booking-field booking-field--wide booking-field--textarea"><span><MessageSquare />Description</span><textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} placeholder="Tell players what the event is about, who can enter, and what makes it worth following." /><small className="booking-field__count">{description.length}/2000</small></label>
                </div>
              </section>

              <section className="booking-section">
                <header><span>02</span><div><h3>Organizer & schedule</h3><p>Who owns it and when it runs.</p></div></header>
                <div className="booking-fields">
                  <label className="booking-field"><span><Building2 />Organization <b>Required</b></span><input required value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Organization name" /></label>
                  <label className="booking-field"><span><Mail />Contact email <b>Required</b></span><input type="email" required value={submitterEmail} onChange={(e) => setSubmitterEmail(e.target.value)} placeholder="organizer@example.com" /></label>
                  <button type="button" className={`booking-recurrence booking-field--wide ${dailyRecurring ? "is-active" : ""}`} onClick={()=>setDailyRecurring(value=>!value)} aria-pressed={dailyRecurring}><span><Repeat2 /></span><span><strong>Runs every day</strong><small>{dailyRecurring ? "Daily recurrence enabled — no dates needed" : "Use for daily scrims and repeating sessions"}</small></span><i /></button>
                  {!dailyRecurring&&<><div className="booking-field"><span><CalendarDays />Start date <b>Required</b></span><DatePicker value={startDate} onChange={setStartDate} icon={CalendarDays} /></div>
                  <div className="booking-field"><span><Clock3 />End date <b>Required</b></span><DatePicker value={endDate} onChange={setEndDate} min={startDate} icon={Clock3} /></div></>}
                  <div className="booking-field"><span><Clock3 />Start time {dailyRecurring&&<b>Required</b>}</span><TimePicker value={startTime} onChange={setStartTime} placeholder="Choose start time" /></div>
                  <div className="booking-field"><span><Clock3 />End time <small>Optional</small></span><TimePicker value={endTime} onChange={setEndTime} placeholder="No end time" optional align="right" /></div>
                  <div className="booking-field"><span><Clock3 />Timezone</span><SearchableSelect value={timezone} onChange={setTimezone} items={timezoneOptions} placeholder="Choose a timezone" searchPlaceholder="Search timezones…" emptyLabel="No timezone found" /></div>
                  <div className="booking-field"><span><MapPin />Region</span><SearchableSelect value={region} onChange={setRegion} items={REGION_OPTIONS} placeholder="Choose a region" searchPlaceholder="Search regions…" emptyLabel="No region found" align="right" /></div>
                  <div className="booking-field booking-field--wide"><LogoUploadInput label="Organization logo" value={orgLogoUrl} onChange={setOrgLogoUrl} pendingFile={orgLogoFile} onPendingFileChange={setOrgLogoFile} /></div>
                </div>
              </section>

              <section className="booking-section">
                <header><span>03</span><div><h3>Links & broadcast</h3><p>Give people somewhere useful to go.</p></div></header>
                <div className="booking-fields">
                  <label className="booking-field"><span><MessageSquare />Discord invite</span><input type="url" value={discordUrl} onChange={(e) => setDiscordUrl(e.target.value)} placeholder="https://discord.gg/…" /></label>
                  <label className="booking-field"><span><Globe2 />Event website</span><input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://…" /></label>
                  <div className="booking-streams booking-field--wide">
                    <div className="booking-streams__head"><span><Radio />Stream links</span><button type="button" onClick={() => setStreamLinks((current) => [...current, { label: "YouTube", url: "" }])}><Plus />Add stream</button></div>
                    {streamLinks.map((stream, index) => <div className="booking-stream" key={index}>
                      <SearchableSelect value={stream.label || ""} onChange={(value) => updateStream(index, "label", value)} items={STREAM_OPTIONS} placeholder="Platform" searchPlaceholder="Search platforms…" />
                      <input type="url" value={stream.url} onChange={(e) => updateStream(index, "url", e.target.value)} placeholder="Paste the full stream URL" />
                      {streamLinks.length > 1 && <button type="button" onClick={() => setStreamLinks((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label="Remove stream"><Trash2 /></button>}
                    </div>)}
                  </div>
                </div>
              </section>
            </div>

            <footer className="booking-footer"><p><ShieldCheck /> Listings are reviewed before publishing.</p><div><button type="button" onClick={onClose}>Cancel</button><button type="submit" disabled={submitting}>{submitting ? <Loader2 className="animate-spin" /> : <Send />}Submit event</button></div></footer>
          </form>
        )}
      </section>
    </div>
  );
};
