/*
# Yahoo OAuth Token Storage and League Selection

## Purpose
Stores Yahoo Fantasy Sports OAuth tokens server-side and tracks
which Yahoo league the user has selected for Fantasy AI to use.
Tokens are NEVER exposed to the frontend — only connection status.

## New Tables

### yahoo_connections
Stores Yahoo OAuth tokens for each authenticated session.
- `id` — UUID primary key
- `session_key` — unique text identifier for the browser session
- `yahoo_guid` — Yahoo user identifier
- `access_token` — Yahoo OAuth access token (server-side only)
- `refresh_token` — Yahoo OAuth refresh token (server-side only)
- `token_type` — usually "bearer"
- `access_token_expires_at` — when the access token expires
- `xoauth_yahoo_guid` — Yahoo GUID from token response
- `status` — connection status: 'connected', 'expired', 'error'
- `created_at` — row creation timestamp
- `updated_at` — last update timestamp

### yahoo_leagues
Caches the user's discovered Yahoo Fantasy leagues and tracks selection.
- `id` — UUID primary key
- `session_key` — links to yahoo_connections
- `provider_league_id` — Yahoo league key
- `league_name` — league name from Yahoo
- `season` — NFL season year
- `num_teams` — number of teams
- `scoring_type` — Yahoo scoring type label
- `is_selected` — whether this is the active league
- `league_metadata` — JSONB for raw Yahoo league data
- `created_at` / `updated_at` — timestamps

## Security
- RLS enabled on both tables with deny-all anon policies (defense-in-depth).
- The edge function uses the service role key (bypasses RLS) to manage tokens.
- Frontend never directly queries these tables — all data flows through edge functions.
- access_token and refresh_token are NEVER returned to the frontend.
*/

CREATE TABLE IF NOT EXISTS yahoo_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key text UNIQUE NOT NULL,
  yahoo_guid text,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_type text DEFAULT 'bearer',
  access_token_expires_at timestamptz NOT NULL,
  xoauth_yahoo_guid text,
  status text NOT NULL DEFAULT 'connected',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE yahoo_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny_anon_select_yahoo_connections" ON yahoo_connections;
CREATE POLICY "deny_anon_select_yahoo_connections"
  ON yahoo_connections FOR SELECT TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "deny_anon_insert_yahoo_connections" ON yahoo_connections;
CREATE POLICY "deny_anon_insert_yahoo_connections"
  ON yahoo_connections FOR INSERT TO anon, authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "deny_anon_update_yahoo_connections" ON yahoo_connections;
CREATE POLICY "deny_anon_update_yahoo_connections"
  ON yahoo_connections FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "deny_anon_delete_yahoo_connections" ON yahoo_connections;
CREATE POLICY "deny_anon_delete_yahoo_connections"
  ON yahoo_connections FOR DELETE TO anon, authenticated USING (false);

CREATE TABLE IF NOT EXISTS yahoo_leagues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key text NOT NULL,
  provider_league_id text NOT NULL,
  league_name text,
  season integer,
  num_teams integer,
  scoring_type text,
  is_selected boolean DEFAULT false,
  league_metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(session_key, provider_league_id)
);

ALTER TABLE yahoo_leagues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny_anon_select_yahoo_leagues" ON yahoo_leagues;
CREATE POLICY "deny_anon_select_yahoo_leagues"
  ON yahoo_leagues FOR SELECT TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "deny_anon_insert_yahoo_leagues" ON yahoo_leagues;
CREATE POLICY "deny_anon_insert_yahoo_leagues"
  ON yahoo_leagues FOR INSERT TO anon, authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "deny_anon_update_yahoo_leagues" ON yahoo_leagues;
CREATE POLICY "deny_anon_update_yahoo_leagues"
  ON yahoo_leagues FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "deny_anon_delete_yahoo_leagues" ON yahoo_leagues;
CREATE POLICY "deny_anon_delete_yahoo_leagues"
  ON yahoo_leagues FOR DELETE TO anon, authenticated USING (false);

CREATE INDEX IF NOT EXISTS idx_yahoo_connections_session_key ON yahoo_connections(session_key);
CREATE INDEX IF NOT EXISTS idx_yahoo_leagues_session_key ON yahoo_leagues(session_key);
