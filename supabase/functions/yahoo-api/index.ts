// Yahoo Fantasy API proxy — Supabase Edge Function.
//
// Makes authenticated Yahoo Fantasy Sports API requests on behalf of the user.
// Tokens are stored server-side (in yahoo_connections table) and refreshed
// automatically when expired. The access_token is NEVER sent to the browser.
//
// Routes (via ?endpoint= query param):
//   leagues       — GET user's Yahoo Fantasy Football leagues for current season
//   league-settings — GET league scoring settings
//   league-teams  — GET all teams in a league
//   user-team     — GET the authenticated user's team in a league
//   roster        — GET a team's roster
//   matchup       — GET current week matchup for a team
//   players       — GET league players (for ownership/waiver status)
//
// Required query params:
//   endpoint — which Yahoo resource to fetch
//   leagueKey — Yahoo league key (e.g. "nfl.l.12345") for league-specific endpoints
//   teamKey — Yahoo team key (e.g. "nfl.l.12345.t.1") for team-specific endpoints
//
// Server-side secrets:
//   YAHOO_CLIENT_ID
//   YAHOO_CLIENT_SECRET
//
// The session is tracked via the fp_session HTTP-only cookie set by yahoo-auth.

import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const YAHOO_TOKEN_URL = "https://api.login.yahoo.com/oauth2/get_token";
const YAHOO_FANTASY_API = "https://fantasysports.yahooapis.com/fantasy/v2";
const SESSION_COOKIE_NAME = "fp_session";
const TOKEN_TTL_BUFFER_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 15000;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("YAHOO_CLIENT_ID");
    const clientSecret = Deno.env.get("YAHOO_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      return jsonResponse(
        { error: "Yahoo OAuth is not configured. Set YAHOO_CLIENT_ID and YAHOO_CLIENT_SECRET." },
        503,
      );
    }

    const sessionKey = getSessionKey(req);
    if (!sessionKey) {
      return jsonResponse({ error: "No Yahoo session found. Connect Yahoo first." }, 401);
    }

    // Get stored tokens
    const conn = await getConnection(sessionKey);
    if (!conn) {
      return jsonResponse({ error: "No Yahoo connection found. Connect Yahoo first." }, 401);
    }

    // Refresh token if expired
    let accessToken = conn.access_token;
    if (isTokenExpired(conn.access_token_expires_at)) {
      const refreshed = await refreshToken(conn.refresh_token, clientId, clientSecret);
      if (!refreshed) {
        await updateConnectionStatus(sessionKey, "expired");
        return jsonResponse(
          { error: "Yahoo token expired and refresh failed. Please reconnect Yahoo." },
          401,
        );
      }
      const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
      await updateTokens(sessionKey, refreshed.access_token, refreshed.refresh_token, expiresAt);
      accessToken = refreshed.access_token;
    }

    // Parse request
    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint") ?? "";
    const leagueKey = url.searchParams.get("leagueKey") ?? "";
    const teamKey = url.searchParams.get("teamKey") ?? "";
    const week = url.searchParams.get("week") ?? "";
    const season = url.searchParams.get("season") ?? String(getCurrentSeason());

    // Build Yahoo API URL
    const yahooUrl = buildYahooUrl(endpoint, { leagueKey, teamKey, week, season });
    if (!yahooUrl) {
      return jsonResponse({ error: `Unknown endpoint: ${endpoint}` }, 400);
    }

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let yahooResp: Response;
    try {
      yahooResp = await fetch(`${YAHOO_FANTASY_API}${yahooUrl}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json",
        },
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      const msg = fetchErr instanceof Error ? fetchErr.message : "Network error";
      return jsonResponse({ error: `Yahoo API request failed: ${msg}` }, 502);
    }
    clearTimeout(timeoutId);

    // Handle Yahoo API errors
    if (!yahooResp.ok) {
      const status = yahooResp.status;
      if (status === 401) {
        return jsonResponse({ error: "Yahoo authentication failed. Please reconnect." }, 401);
      }
      if (status === 403) {
        return jsonResponse({ error: "Yahoo permission denied for this resource." }, 403);
      }
      if (status === 404) {
        return jsonResponse({ error: "Yahoo league or team not found." }, 404);
      }
      if (status === 429) {
        return jsonResponse({ error: "Yahoo API rate limit exceeded. Try again later." }, 429);
      }
      let detail = "";
      try {
        detail = (await yahooResp.text()).slice(0, 200);
      } catch { /* ignore */ }
      return jsonResponse(
        { error: `Yahoo API returned ${status}`, detail: detail || undefined },
        status,
      );
    }

    const data = await yahooResp.json();
    return jsonResponse({ data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("yahoo-api error:", msg);
    return jsonResponse({ error: "Yahoo API request failed." }, 500);
  }
});

// ---- Yahoo URL builder ----

function buildYahooUrl(
  endpoint: string,
  params: { leagueKey: string; teamKey: string; week: string; season: string },
): string | null {
  switch (endpoint) {
    case "leagues":
      // GET users;use_login=/games;game_keys=nfl.season/leagues
      return `/users;use_login=1/games;game_keys=nfl.${params.season}/leagues`;

    case "league-settings":
      if (!params.leagueKey) return null;
      return `/league/${params.leagueKey}/settings`;

    case "league-teams":
      if (!params.leagueKey) return null;
      return `/league/${params.leagueKey}/teams`;

    case "league-standings":
      if (!params.leagueKey) return null;
      return `/league/${params.leagueKey}/standings`;

    case "user-team":
      if (!params.leagueKey) return null;
      return `/users;use_login=1/teams;league_keys=${params.leagueKey}`;

    case "roster": {
      if (!params.teamKey) return null;
      const weekParam = params.week ? `;week=${params.week}` : "";
      return `/team/${params.teamKey}/roster${weekParam}`;
    }

    case "matchup": {
      if (!params.teamKey) return null;
      const matchupWeek = params.week ? `;week=${params.week}` : "";
      return `/team/${params.teamKey}/matchups${matchupWeek}`;
    }

    case "players":
      if (!params.leagueKey) return null;
      return `/league/${params.leagueKey}/players`;

    default:
      return null;
  }
}

// ---- Helpers ----

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getCurrentSeason(): number {
  const now = new Date();
  return now.getMonth() < 8 ? now.getFullYear() - 1 : now.getFullYear();
}

function getSessionKey(req: Request): string | null {
  const cookies = req.headers.get("Cookie") ?? "";
  for (const cookie of cookies.split(";")) {
    const [name, value] = cookie.trim().split("=");
    if (name === SESSION_COOKIE_NAME && value) return value;
  }
  return null;
}

function isTokenExpired(expiresAt: string): boolean {
  return Date.now() + TOKEN_TTL_BUFFER_MS > new Date(expiresAt).getTime();
}

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, serviceRoleKey);
}

async function getConnection(sessionKey: string): Promise<{
  access_token: string;
  refresh_token: string;
  access_token_expires_at: string;
} | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("yahoo_connections")
    .select("access_token, refresh_token, access_token_expires_at")
    .eq("session_key", sessionKey)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

async function updateTokens(
  sessionKey: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: string,
): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase
    .from("yahoo_connections")
    .update({
      access_token: accessToken,
      refresh_token: refreshToken,
      access_token_expires_at: expiresAt,
      status: "connected",
      updated_at: new Date().toISOString(),
    })
    .eq("session_key", sessionKey);
}

async function updateConnectionStatus(sessionKey: string, status: string): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase
    .from("yahoo_connections")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("session_key", sessionKey);
}

async function refreshToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
): Promise<{ access_token: string; refresh_token: string; expires_in: number } | null> {
  try {
    const resp = await fetch(YAHOO_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!resp.ok) return null;
    const tokens = await resp.json();
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? refreshToken,
      expires_in: tokens.expires_in ?? 3600,
    };
  } catch {
    return null;
  }
}
