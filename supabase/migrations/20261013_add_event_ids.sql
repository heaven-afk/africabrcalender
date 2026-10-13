-- ─── ADD EVENT_IDS TO PUSH_SUBSCRIPTIONS ──────────────────────────────────────
-- Run in Supabase SQL Editor to enable per-event reminders

ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS event_ids TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_event_ids
  ON public.push_subscriptions USING GIN (event_ids);
