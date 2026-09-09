// Yahoo Fantasy API client — calls the secure Supabase Edge Function proxy.
// The Yahoo access token is NEVER in frontend code — it lives server-side.
// This module handles HTTP communication with the yahoo-api edge function.

const AUTH_FUNCTION_PATH = "yahoo-auth";
const API_FUNCTION_PATH = "yahoo-api";

function getBaseUrl(): string {
  return import.meta.env.VITE_SUPABASE_URL;
}

function getAuthHeaders(): Record<string, string> {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return {
    Authorization: `Bearer ${anonKey}`,
    "Content-Type": "application/json",
  };
}

// ---- OAuth flow ----

export function getAuthStartUrl(): string {
  return `${getBaseUrl()}/functions/v1/${AUTH_FUNCTION_PATH}?action=start`;
}

export async function fetchAuthStatus(): Promise<YahooAuthStatusResponse> {
  const resp = await fetch(
    `${getBaseUrl()}/functions/v1/${AUTH_FUNCTION_PATH}?action=status`,
    { headers: getAuthHeaders(), credentials: "include" },
  );
  if (!resp.ok) {
    return { configured: false, connected: false, status: "error", message: "Status check failed." };
  }
  return resp.json();
}

export async function disconnectYahoo(): Promise<{ success: boolean; message?: string }> {
  const resp = await fetch(
    `${getBaseUrl()}/functions/v1/${AUTH_FUNCTION_PATH}?action=disconnect`,
    { method: "GET", headers: getAuthHeaders(), credentials: "include" },
  );
  if (!resp.ok) {
    return { success: false };
  }
  return resp.json();
}

// ---- Yahoo Fantasy API calls ----

interface ApiResponse {
  data?: unknown;
  error?: string;
  detail?: string;
}

async function callYahooApi(
  endpoint: string,
  params: Record<string, string> = {},
): Promise<unknown> {
  const url = new URL(`${getBaseUrl()}/functions/v1/${API_FUNCTION_PATH}`);
  url.searchParams.set("endpoint", endpoint);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const resp = await fetch(url.toString(), {
    headers: getAuthHeaders(),
    credentials: "include", // Send the session cookie
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({})) as ApiResponse;
    throw new YahooApiError(body.error ?? `Yahoo API request failed (${resp.status})`, resp.status);
  }

  const body = await resp.json() as ApiResponse;
  if (body.error) {
    throw new YahooApiError(body.error, 500);
  }
  return body.data;
}

export class YahooApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "YahooApiError";
    this.status = status;
  }
}

// ---- Typed API methods ----

export async function fetchYahooLeagues(season?: number): Promise<unknown> {
  return callYahooApi("leagues", season ? { season: String(season) } : {});
}

export async function fetchYahooLeagueSettings(leagueKey: string): Promise<unknown> {
  return callYahooApi("league-settings", { leagueKey });
}

export async function fetchYahooLeagueTeams(leagueKey: string): Promise<unknown> {
  return callYahooApi("league-teams", { leagueKey });
}

export async function fetchYahooLeagueStandings(leagueKey: string): Promise<unknown> {
  return callYahooApi("league-standings", { leagueKey });
}

export async function fetchYahooUserTeam(leagueKey: string): Promise<unknown> {
  return callYahooApi("user-team", { leagueKey });
}

export async function fetchYahooRoster(teamKey: string, week?: number): Promise<unknown> {
  return callYahooApi("roster", { teamKey, ...(week ? { week: String(week) } : {}) });
}

export async function fetchYahooMatchup(teamKey: string, week?: number): Promise<unknown> {
  return callYahooApi("matchup", { teamKey, ...(week ? { week: String(week) } : {}) });
}

export async function fetchYahooLeaguePlayers(leagueKey: string): Promise<unknown> {
  return callYahooApi("players", { leagueKey });
}

// ---- Types exposed to the service layer ----

export interface YahooAuthStatusResponse {
  configured: boolean;
  connected: boolean;
  status: string;
  yahooGuid?: string;
  message: string;
}
