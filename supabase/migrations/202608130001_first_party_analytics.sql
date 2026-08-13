-- Anonymous, first-party site analytics. Raw IP addresses are intentionally not stored.
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

-- There are deliberately no anon/authenticated policies. Collection and reports go through server-only routes.
REVOKE ALL ON TABLE public.analytics_sessions FROM anon, authenticated;
REVOKE ALL ON TABLE public.analytics_events FROM anon, authenticated;
GRANT ALL ON TABLE public.analytics_sessions TO service_role;
GRANT ALL ON TABLE public.analytics_events TO service_role;

COMMENT ON TABLE public.analytics_sessions IS 'Anonymous first-party web analytics sessions; contains no raw IP addresses.';
COMMENT ON TABLE public.analytics_events IS 'Anonymous first-party page views and product interactions.';

