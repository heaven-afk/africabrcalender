-- ─── PUSH SUBSCRIPTIONS ─────────────────────────────────────────────────────
-- Run in Supabase SQL Editor after schema.sql

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint     TEXT NOT NULL UNIQUE,
  p256dh       TEXT NOT NULL,
  auth         TEXT NOT NULL,
  -- Empty array = all categories. Non-empty = only those categories.
  categories   TEXT[] NOT NULL DEFAULT '{}',
  -- Specific event IDs the user requested reminders for
  event_ids    TEXT[] NOT NULL DEFAULT '{}',
  -- true for admin browser sessions: receives submission alerts only
  is_admin     BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_event_ids
  ON public.push_subscriptions USING GIN (event_ids);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_is_admin
  ON public.push_subscriptions(is_admin);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Only the server-side service role can read/write subscriptions
REVOKE ALL ON TABLE public.push_subscriptions FROM anon, authenticated;
GRANT ALL ON TABLE public.push_subscriptions TO service_role;
