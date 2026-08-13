-- ─── SUPABASE POSTGRESQL SCHEMA FOR ESPORTS CALENDAR ─────────────────────────
-- Run this script in your Supabase SQL Editor (https://app.supabase.com -> SQL Editor)

CREATE TABLE IF NOT EXISTS public.events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  game TEXT,
  stage TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  org_name TEXT NOT NULL,
  org_logo_url TEXT,
  region TEXT,
  stream_links JSONB DEFAULT '[]'::jsonb,
  location JSONB DEFAULT '{}'::jsonb,
  recurrence JSONB,
  status TEXT DEFAULT 'approved',
  submitter_email TEXT,
  submitted_at TEXT,
  created_by TEXT,
  updated_at TEXT,
  updated_by TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Allow public read access to approved events
CREATE POLICY "Allow public read access to approved events"
ON public.events
FOR SELECT
USING (status IS NULL OR status = 'approved' OR status = 'pending');

-- Allow service role & anon to insert/update events
CREATE POLICY "Allow public insert for bookings"
ON public.events
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow update for all events"
ON public.events
FOR UPDATE
USING (true);

CREATE POLICY "Allow delete for all events"
ON public.events
FOR DELETE
USING (true);

-- Indexes for fast date range filtering
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_end_date ON public.events(end_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);

-- Anonymous first-party analytics. Keep this block aligned with supabase/migrations/202608130001_first_party_analytics.sql.
CREATE TABLE IF NOT EXISTS public.analytics_sessions (
  session_id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  entry_path TEXT NOT NULL DEFAULT '/',
  exit_path TEXT NOT NULL DEFAULT '/',
  referrer TEXT,
  referrer_host TEXT,
  source TEXT NOT NULL DEFAULT 'Direct',
  medium TEXT,
  campaign TEXT,
  country_code TEXT NOT NULL DEFAULT 'Unknown',
  region TEXT,
  city TEXT,
  device_type TEXT NOT NULL DEFAULT 'Other',
  browser TEXT NOT NULL DEFAULT 'Other',
  os TEXT NOT NULL DEFAULT 'Other',
  pageviews INTEGER NOT NULL DEFAULT 0 CHECK (pageviews >= 0),
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  max_scroll_depth INTEGER NOT NULL DEFAULT 0 CHECK (max_scroll_depth BETWEEN 0 AND 100),
  is_bounce BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  path TEXT NOT NULL DEFAULT '/',
  referrer_path TEXT,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_started_at ON public.analytics_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_visitor ON public.analytics_sessions(visitor_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_country ON public.analytics_sessions(country_code, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_source ON public.analytics_sessions(source, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_occurred_at ON public.analytics_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON public.analytics_events(session_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON public.analytics_events(event_name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_path ON public.analytics_events(path, occurred_at DESC);

ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.analytics_sessions FROM anon, authenticated;
REVOKE ALL ON TABLE public.analytics_events FROM anon, authenticated;
GRANT ALL ON TABLE public.analytics_sessions TO service_role;
GRANT ALL ON TABLE public.analytics_events TO service_role;
