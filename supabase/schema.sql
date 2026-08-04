-- ─── SUPABASE POSTGRESQL SCHEMA FOR AFRICA BR CALENDAR ───────────────────────
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
