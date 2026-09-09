// FantasyPros provider client — calls the secure Supabase Edge Function
// which proxies requests to the FantasyPros API.
//
// SECURITY: The FantasyPros API key is NEVER in frontend code.
// It lives only as a server-side environment variable on the edge function.
//
// // TODO-INTEGRATION: FANTASYPROS_API
// To activate: set the FANTASYPROS_API_KEY secret on the Supabase edge function.
// See docs/INTEGRATION_ROADMAP.md for deployment instructions.

import {
  mapProjection,
  mapPerformance,
  mapRanking,
  mapInjury,
  mapNews,
  type RawFPProjection,
  type RawFPRanking,
  type RawFPInjury,
  type RawFPNews,
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

// The edge function endpoint — deployed at /functions/v1/fantasy-data
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
    providerAvailable = resp.ok;
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

interface EdgeFunctionResponse<T> {
  data?: T;
  error?: string;
}

async function callEdgeFunction<T>(
  endpoint: string,
  params: Record<string, string>,
): Promise<T | null> {
  const url = new URL(getEdgeFunctionUrl());
  url.searchParams.set('endpoint', endpoint);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const resp = await fetch(url.toString(), { headers: getHeaders() });

  if (!resp.ok) {
    // 503 = provider not configured / unavailable
    if (resp.status === 503) {
      providerAvailable = false;
      return null;
    }
    throw new Error(`Fantasy data request failed (${resp.status})`);
  }

  const body = await resp.json() as EdgeFunctionResponse<T>;
  if (body.error) {
    throw new Error(body.error);
  }
  return body.data ?? null;
}

// ---- Public provider functions ----

export async function fetchWeeklyProjections(
  season: number,
  week: number,
  scoringFormat: ScoringFormat,
  position?: string,
): Promise<PlayerWeeklyProjection[]> {
  const raw = await callEdgeFunction<RawFPProjection[]>('projections', {
    season: String(season),
    week: String(week),
    scoring: scoringFormatToFP(scoringFormat),
    ...(position ? { position } : {}),
  });
  if (!raw) return [];

  const projections: PlayerWeeklyProjection[] = [];
  for (const r of raw) {
    const fpId = r.player_id;
    if (!fpId) continue;
    const sleeperId = await findNormalizedPlayerByFantasyProsId(fpId);
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
  const raw = await callEdgeFunction<RawFPProjection[]>('points', {
    season: String(season),
    week: String(week),
    scoring: scoringFormatToFP(scoringFormat),
  });
  if (!raw) return [];

  const performances: PlayerFantasyPerformance[] = [];
  for (const r of raw) {
    const fpId = r.player_id;
    if (!fpId) continue;
    const sleeperId = await findNormalizedPlayerByFantasyProsId(fpId);
    if (!sleeperId) continue;
    performances.push(mapPerformance(r, sleeperId, season, week, scoringFormat));
  }
  return performances;
}

export async function fetchRankings(
  week: number,
  scoringFormat: ScoringFormat,
  position?: string,
): Promise<PlayerRanking[]> {
  const raw = await callEdgeFunction<RawFPRanking[]>('rankings', {
    week: String(week),
    scoring: scoringFormatToFP(scoringFormat),
    ...(position ? { position } : {}),
  });
  if (!raw) return [];

  const rankings: PlayerRanking[] = [];
  for (const r of raw) {
    const fpId = r.player_id;
    if (!fpId) continue;
    const sleeperId = await findNormalizedPlayerByFantasyProsId(fpId);
    if (!sleeperId) continue;
    const mapped = mapRanking(r, sleeperId, scoringFormat, week);
    if (mapped) rankings.push(mapped);
  }
  return rankings;
}

export async function fetchInjuries(): Promise<PlayerInjury[]> {
  const raw = await callEdgeFunction<RawFPInjury[]>('injuries', {});
  if (!raw) return [];

  const injuries: PlayerInjury[] = [];
  for (const r of raw) {
    const fpId = r.player_id;
    if (!fpId) continue;
    const sleeperId = await findNormalizedPlayerByFantasyProsId(fpId);
    if (!sleeperId) continue;
    injuries.push(mapInjury(r, sleeperId));
  }
  return injuries;
}

export async function fetchPlayerNews(playerId: string): Promise<PlayerNews[]> {
  const raw = await callEdgeFunction<RawFPNews[]>('news', { playerId });
  if (!raw) return [];

  return raw.map((r) => mapNews(r, playerId));
}

export async function fetchAllPlayerMetadata(): Promise<RawFPPlayer[]> {
  const raw = await callEdgeFunction<RawFPPlayer[]>('players', {});
  return raw ?? [];
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
