"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowUpRight, BarChart3, CalendarRange, ChevronDown,
  Clock3, Eye, Filter, Gauge, Globe2, Laptop2, Loader2, MousePointerClick,
  RefreshCw, Route, Users, X,
} from "lucide-react";
import { AnalyticsBreakdownRow, AnalyticsReport } from "@/types/analytics";

type Preset = "7d" | "30d" | "90d" | "custom";

function dateInput(date: Date) { return date.toISOString().slice(0, 10); }
function presetDates(preset: Exclude<Preset, "custom">) {
  const end = new Date();
  const days = Number.parseInt(preset, 10);
  const start = new Date(end); start.setDate(start.getDate() - days + 1);
  return { start: dateInput(start), end: dateInput(end) };
}
function formatNumber(value: number) { return new Intl.NumberFormat("en", { notation: value >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value); }
function formatDuration(seconds: number) { const rounded = Math.round(seconds); return rounded >= 60 ? `${Math.floor(rounded / 60)}m ${rounded % 60}s` : `${rounded}s`; }
function countryLabel(code: string) {
  if (code === "Unknown") return code;
  try { return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code; } catch { return code; }
}

function Change({ value, inverse = false }: { value: number | null; inverse?: boolean }) {
  if (value === null) return <span className="analytics-change is-neutral">New</span>;
  const positive = value > 0;
  const good = inverse ? !positive : positive;
  return <span className={`analytics-change ${value === 0 ? "is-neutral" : good ? "is-positive" : "is-negative"}`}>
    {positive ? <ArrowUpRight /> : value < 0 ? <ArrowDownRight /> : null}{value === 0 ? "No change" : `${Math.abs(value).toFixed(1)}%`}
  </span>;
}

function Breakdown({ rows, empty = "No data for this period", country = false }: { rows: AnalyticsBreakdownRow[]; empty?: string; country?: boolean }) {
  if (!rows.length) return <div className="analytics-empty"><Activity /><span>{empty}</span></div>;
  return <div className="analytics-breakdown">{rows.map((row) => <div className="analytics-breakdown__row" key={row.key}>
    <div><strong>{country ? countryLabel(row.label) : row.label}</strong><small>{row.visitors} visitor{row.visitors === 1 ? "" : "s"}</small></div>
    <div className="analytics-breakdown__meter"><span style={{ width: `${Math.max(2, row.percentage)}%` }} /></div>
    <b>{formatNumber(row.value)}</b>
  </div>)}</div>;
}

function TrendChart({ report }: { report: AnalyticsReport }) {
  const values = report.timeseries.map((point) => point.visitors);
  const max = Math.max(1, ...values);
  const points = values.map((value, index) => `${(index / Math.max(1, values.length - 1)) * 800},${205 - (value / max) * 175}`).join(" ");
  const area = `0,220 ${points} 800,220`;
  return <div className="analytics-chart">
    <div className="analytics-chart__head"><div><span>Audience trend</span><strong>Daily unique visitors</strong></div><div className="analytics-chart__legend"><i />Visitors</div></div>
    <svg viewBox="0 0 800 220" preserveAspectRatio="none" role="img" aria-label="Daily visitors chart">
      <defs><linearGradient id="analytics-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4F7CFF" stopOpacity=".28" /><stop offset="1" stopColor="#4F7CFF" stopOpacity="0" /></linearGradient></defs>
      <line x1="0" x2="800" y1="205" y2="205" /><line x1="0" x2="800" y1="117" y2="117" /><line x1="0" x2="800" y1="30" y2="30" />
      <polygon points={area} fill="url(#analytics-area)" /><polyline points={points} />
    </svg>
    <div className="analytics-chart__axis"><span>{report.timeseries[0]?.date || ""}</span><span>{report.timeseries.at(-1)?.date || ""}</span></div>
  </div>;
}

export function AdminAnalyticsDashboard() {
  const initial = presetDates("30d");
  const [preset, setPreset] = useState<Preset>("30d");
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [country, setCountry] = useState("");
  const [source, setSource] = useState("");
  const [device, setDevice] = useState("");
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  const query = useMemo(() => {
    const params = new URLSearchParams({ start, end });
    if (country) params.set("country", country);
    if (source) params.set("source", source);
    if (device) params.set("device", device);
    return params.toString();
  }, [start, end, country, source, device]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(null);
    fetch(`/api/admin/analytics?${query}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => { const json = await response.json(); if (!response.ok || !json.success) throw new Error(json.error || "Analytics could not be loaded."); return json.data as AnalyticsReport; })
      .then(setReport).catch((caught) => { if (caught.name !== "AbortError") setError(caught.message); }).finally(() => setLoading(false));
    return () => controller.abort();
  }, [query, reload]);

  const choosePreset = (value: Preset) => {
    setPreset(value);
    if (value !== "custom") { const dates = presetDates(value); setStart(dates.start); setEnd(dates.end); }
  };
  const clearFilters = () => { setCountry(""); setSource(""); setDevice(""); };
  const filtersActive = Boolean(country || source || device);

  return <section className="analytics-dashboard">
    <header className="analytics-toolbar">
      <div className="analytics-toolbar__title"><span><BarChart3 /></span><div><h1>Analytics</h1><p>Audience, acquisition, engagement and visitor journeys.</p></div></div>
      <div className="analytics-toolbar__actions">
        <div className="analytics-presets" aria-label="Date range">{(["7d", "30d", "90d"] as Preset[]).map((value) => <button type="button" key={value} className={preset === value ? "is-active" : ""} onClick={() => choosePreset(value)}>{value.replace("d", " days")}</button>)}<button type="button" className={preset === "custom" ? "is-active" : ""} onClick={() => choosePreset("custom")}>Custom</button></div>
        <button type="button" className="analytics-refresh" onClick={() => setReload((value) => value + 1)} aria-label="Refresh analytics"><RefreshCw className={loading ? "animate-spin" : ""} /></button>
      </div>
    </header>

    <div className="analytics-controls">
      <label><CalendarRange /><span>From</span><input type="date" value={start} max={end} onChange={(event) => { setPreset("custom"); setStart(event.target.value); }} /></label>
      <label><CalendarRange /><span>To</span><input type="date" value={end} min={start} max={dateInput(new Date())} onChange={(event) => { setPreset("custom"); setEnd(event.target.value); }} /></label>
      <label><Globe2 /><span>Country</span><select value={country} onChange={(event) => setCountry(event.target.value)}><option value="">All countries</option>{report?.filters.countries.map((value) => <option value={value} key={value}>{countryLabel(value)}</option>)}</select></label>
      <label><Route /><span>Source</span><select value={source} onChange={(event) => setSource(event.target.value)}><option value="">All sources</option>{report?.filters.sources.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
      <label><Laptop2 /><span>Device</span><select value={device} onChange={(event) => setDevice(event.target.value)}><option value="">All devices</option>{report?.filters.devices.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
      {filtersActive && <button type="button" className="analytics-clear" onClick={clearFilters}><X />Clear filters</button>}
    </div>

    {error ? <div className="analytics-error"><Gauge /><div><strong>Analytics unavailable</strong><p>{error}</p></div><button type="button" onClick={() => setReload((value) => value + 1)}>Try again</button></div> : loading && !report ? <div className="analytics-loading"><Loader2 className="animate-spin" /><span>Preparing analytics…</span></div> : report && <>
      <div className="analytics-metrics">
        <article><span><Users />Visitors</span><strong>{formatNumber(report.totals.visitors.value)}</strong><Change value={report.totals.visitors.change} /></article>
        <article><span><Activity />Sessions</span><strong>{formatNumber(report.totals.sessions.value)}</strong><Change value={report.totals.sessions.change} /></article>
        <article><span><Eye />Page views</span><strong>{formatNumber(report.totals.pageviews.value)}</strong><Change value={report.totals.pageviews.change} /></article>
        <article><span><Gauge />Bounce rate</span><strong>{report.totals.bounceRate.value.toFixed(1)}%</strong><Change value={report.totals.bounceRate.change} inverse /></article>
        <article><span><Clock3 />Avg. duration</span><strong>{formatDuration(report.totals.avgDuration.value)}</strong><Change value={report.totals.avgDuration.change} /></article>
        <article><span><MousePointerClick />Event views</span><strong>{formatNumber(report.totals.eventViews.value)}</strong><Change value={report.totals.eventViews.change} /></article>
      </div>

      <TrendChart report={report} />

      <div className="analytics-grid analytics-grid--two">
        <details className="analytics-panel" open><summary><span><Route />Traffic acquisition</span><ChevronDown /></summary><div className="analytics-panel__body"><Breakdown rows={report.sources} /></div></details>
        <details className="analytics-panel" open><summary><span><Globe2 />Countries</span><ChevronDown /></summary><div className="analytics-panel__body"><Breakdown rows={report.countries} country /></div></details>
      </div>

      <details className="analytics-panel analytics-funnel-panel" open><summary><span><Filter />Visitor funnel</span><ChevronDown /></summary><div className="analytics-funnel">{report.funnel.map((step, index) => <div key={step.label}><span><b>{index + 1}</b>{step.label}</span><strong>{formatNumber(step.value)}</strong><div><i style={{ width: `${Math.max(1, step.percentage)}%` }} /></div><small>{step.percentage.toFixed(1)}% of sessions</small></div>)}</div></details>

      <div className="analytics-grid analytics-grid--two">
        <details className="analytics-panel" open><summary><span><Eye />Top pages</span><ChevronDown /></summary><div className="analytics-panel__body"><Breakdown rows={report.pages} /></div></details>
        <details className="analytics-panel" open><summary><span><MousePointerClick />Visitor actions</span><ChevronDown /></summary><div className="analytics-panel__body"><Breakdown rows={report.actions} /></div></details>
        <details className="analytics-panel"><summary><span><Route />Entry pages</span><ChevronDown /></summary><div className="analytics-panel__body"><Breakdown rows={report.entryPages} /></div></details>
        <details className="analytics-panel"><summary><span><Route />Exit and drop-off pages</span><ChevronDown /></summary><div className="analytics-panel__body"><Breakdown rows={report.exitPages} /></div></details>
        <details className="analytics-panel"><summary><span><Laptop2 />Devices</span><ChevronDown /></summary><div className="analytics-panel__body"><Breakdown rows={report.devices} /></div></details>
        <details className="analytics-panel"><summary><span><Globe2 />Browsers</span><ChevronDown /></summary><div className="analytics-panel__body"><Breakdown rows={report.browsers} /></div></details>
      </div>
      <footer className="analytics-footnote">Anonymous first-party analytics · No raw IP addresses stored · Updated {new Date(report.generatedAt).toLocaleString()}</footer>
    </>}
  </section>;
}

