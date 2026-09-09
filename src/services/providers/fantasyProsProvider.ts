// FantasyPros provider client — calls the secure Supabase Edge Function
// which proxies requests to the FantasyPros API.
//
// SECURITY: The FantasyPros API key is NEVER in frontend code.
// It lives only as a server-side environment variable on the edge function.

import {
  mapProjection,
  mapPerformance,
  mapRanking,
  mapInjury,
  mapNews,
  type RawFPProjectionPlayer,
  type RawFPRankingPlayer,
  type RawFPInjury,
  type RawFPNewsItem,
  type RawFPPlayer,
} from '../fantasyData/fantasyDataMapper';
import type {
  PlayerWeeklyProjection,
  PlayerFantasyPerformance,
  PlayerRanking,
  PlayerInjury,
  PlayerNews,
  ScoringFormat,
} from '@/types';
import { findNormalizedPlayerByFantasyProsId } from '../fantasyData/playerCrosswalk';

const EDGE_FUNCTION_PATH = 'fantasy-data';

function getEdgeFunctionUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return `${url}/functions/v1/${EDGE_FUNCTION_PATH}`;
}

function getHeaders(): Record<string, string> {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return {
    Authorization: `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
  };
}

// ---- Provider status ----

let providerAvailable: boolean | null = null;

export async function checkProviderStatus(): Promise<boolean> {
  if (providerAvailable !== null) return providerAvailable;
  try {
    const url = getEdgeFunctionUrl();
    const resp = await fetch(`${url}?endpoint=status`, {
      headers: getHeaders(),
    });
    if (resp.ok) {
      const body = await resp.json();
      const available = body?.data?.available ?? false;
      providerAvailable = Boolean(available);
    } else {
      providerAvailable = false;
    }
    return providerAvailable;
  } catch {
    providerAvailable = false;
    return false;
  }
}

export function resetProviderStatus(): void {
  providerAvailable = null;
}

// ---- API calls (all go through the edge function) ----

// FantasyPros wraps arrays in a { players: [...] } or { data: [...] } envelope.
interface FPResponse<T> {
  sport?: string;
  count?: number;
  players?: T[];
  data?: T[];
  [key: string]: unknown;
}

interface EdgeFunctionResponse {
  data?: FPResponse<unknown>;
  error?: string;
  detail?: string;
}

async function callEdgeFunction(
  endpoint: string,
  params: Record<string, string>,
): Promise<unknown | null> {
  const url = new URL(getEdgeFunctionUrl());
  url.searchParams.set('endpoint', endpoint);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const resp = await fetch(url.toString(), { headers: getHeaders() });

  if (!resp.ok) {
    if (resp.status === 503) {
      providerAvailable = false;
      return null;
    }
    // Try to extract error detail
    try {
      const body = await resp.json() as EdgeFunctionResponse;
      throw new Error(body.detail ?? body.error ?? `Fantasy data request failed (${resp.status})`);
    } catch {
      throw new Error(`Fantasy data request failed (${resp.status})`);
    }
  }

  const body = await resp.json() as EdgeFunctionResponse;
  if (body.error) {
    throw new Error(body.error);
  }
  return body.data ?? null;
}

function extractPlayers<T>(data: unknown): T[] {
  if (!data || typeof data !== 'object') return [];
  const resp = data as FPResponse<T>;
  return resp.players ?? resp.data ?? [];
}

// ---- Public provider functions ----

export async function fetchWeeklyProjections(
  season: number,
  week: number,
  scoringFormat: ScoringFormat,
  position?: string,
): Promise<PlayerWeeklyProjection[]> {
  const data = await callEdgeFunction('projections', {
    season: String(season),
    scoring: scoringFormatToFP(scoringFormat),
    week: String(week),
    ...(position ? { position } : {}),
  });
  const rawPlayers = extractPlayers<RawFPProjectionPlayer>(data);
  if (rawPlayers.length === 0) return [];

  const projections: PlayerWeeklyProjection[] = [];
  for (const r of rawPlayers) {
    const fpId = r.fpid;
    if (!fpId) continue;
    const sleeperId = await findNormalizedPlayerByFantasyProsId(String(fpId));
    if (!sleeperId) continue;
    projections.push(mapProjection(r, sleeperId, season, week, scoringFormat));
  }
  return projections;
}

export async function fetchPlayerFantasyPoints(
  season: number,
  week: number,
  scoringFormat: ScoringFormat,
): Promise<PlayerFantasyPerformance[]> {
  const data = await callEdgeFunction('player-points', {
    season: String(season),
    week_start: String(week),
    week_end: String(week),
    scoring: scoringFormatToFP(scoringFormat),
  });
  const rawPlayers = extractPlayers<RawFPProjectionPlayer>(data);
  if (rawPlayers.length === 0) return [];

  const performances: PlayerFantasyPerformance[] = [];
  for (const r of rawPlayers) {
    const fpId = r.fpid;
    if (!fpId) continue;
    const sleeperId = await findNormalizedPlayerByFantasyProsId(String(fpId));
    if (!sleeperId) continue;
    performances.push(mapPerformance(r, sleeperId, season, week, scoringFormat));
  }
  return performances;
}

export async function fetchRankings(
  season: number,
  week: number,
  scoringFormat: ScoringFormat,
  position?: string,
): Promise<PlayerRanking[]> {
  const data = await callEdgeFunction('consensus-rankings', {
    season: String(season),
    scoring: scoringFormatToFP(scoringFormat),
    ...(position ? { position } : {}),
  });
  const rawPlayers = extractPlayers<RawFPRankingPlayer>(data);
  if (rawPlayers.length === 0) return [];

  const rankings: PlayerRanking[] = [];
  for (const r of rawPlayers) {
    const fpId = r.player_id;
    if (!fpId) continue;
    const sleeperId = await findNormalizedPlayerByFantasyProsId(String(fpId));
    if (!sleeperId) continue;
    const mapped = mapRanking(r, sleeperId, scoringFormat, week);
    if (mapped) rankings.push(mapped);
  }
  return rankings;
}

export async function fetchInjuries(
  season: number,
  week: number,
): Promise<PlayerInjury[]> {
  const data = await callEdgeFunction('injuries', {
    season: String(season),
    week: String(week),
  });
  // Injuries endpoint wraps data in an 'injuries' key, not 'players'
  const fpData = data as { injuries?: RawFPInjury[]; players?: RawFPInjury[] } | null;
  const rawInjuries = fpData?.injuries ?? fpData?.players ?? [];
  if (rawInjuries.length === 0) return [];

  const injuries: PlayerInjury[] = [];
  for (const r of rawInjuries) {
    const fpId = r.player_id;
    if (!fpId) continue;
    const sleeperId = await findNormalizedPlayerByFantasyProsId(String(fpId));
    if (!sleeperId) continue;
    injuries.push(mapInjury(r, sleeperId));
  }
  return injuries;
}

export async function fetchPlayerNews(playerId: string): Promise<PlayerNews[]> {
  const data = await callEdgeFunction('news', {
    player_id: playerId,
  });
  const rawNews = extractPlayers<RawFPNewsItem>(data);
  if (rawNews.length === 0) return [];

  return rawNews.map((r) => mapNews(r, playerId));
}

export async function fetchAllPlayerMetadata(): Promise<RawFPPlayer[]> {
  const data = await callEdgeFunction('players', {});
  return extractPlayers<RawFPPlayer>(data);
}

/**
 * Fetches raw ranking players (before crosswalk mapping) for crosswalk building.
 * Returns the raw FantasyPros ranking players with player_id, name, team, position.
 */
export async function fetchRawRankingPlayers(
  season: number,
  position: string,
): Promise<RawFPRankingPlayer[]> {
  const data = await callEdgeFunction('consensus-rankings', {
    season: String(season),
    scoring: 'PPR',
    position,
  });
  return extractPlayers<RawFPRankingPlayer>(data);
}

// ---- Helpers ----

function scoringFormatToFP(format: ScoringFormat): string {
  switch (format) {
    case 'Standard': return 'STD';
    case 'Half-PPR': return 'HALF';
    case 'Full-PPR':
    case 'PPR': return 'PPR';
    default: return 'STD';
  }
}
