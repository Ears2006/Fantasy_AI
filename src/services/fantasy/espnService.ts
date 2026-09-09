// ESPN Fantasy Sports adapter layer.
//
// Only the adapter/interface architecture exists — no real ESPN API calls.
// ESPN Fantasy authentication requires private cookies (SWID + ESPN_S2)
// for private leagues, which is undocumented and fragile. This module
// is a placeholder so a future developer knows where to add it.
//
// // TODO-INTEGRATION: ESPN_FANTASY
//
// Do NOT attempt undocumented authentication hacks here.
// Do NOT pretend ESPN integration works.
//
// FUTURE IMPLEMENTATION:
// 1. Research the current ESPN Fantasy API authentication method.
// 2. Implement auth via a Supabase Edge Function that handles cookie
//    exchange securely.
// 3. Pull league settings, teams, rosters, and standings.
// 4. Map ESPN payloads into the shared types via an espnMapper module.

import type {
  FantasyLeague,
  FantasyRoster,
  FantasyTeam,
  LeagueScoringSettings,
  WeeklyMatchup,
} from '@/types';
import { mockLeagueFull, mockUserTeam, mockWeeklyMatchup } from '@/mock/data';

const IS_MOCK = true;

export interface EspnLeagueSummary {
  id: string;
  name: string;
  teams: number;
  season: number;
}

// ---- Connection ----

/**
 * // TODO-INTEGRATION: ESPN_FANTASY
 * MOCK: Returns a not-implemented status. ESPN is not connected.
 * Real: Would handle ESPN credential exchange.
 */
export async function connectEspn(): Promise<{ connected: boolean }> {
  if (IS_MOCK) {
    return { connected: false };
  }
  throw new Error('ESPN auth not implemented');
}

/**
 * // TODO-INTEGRATION: ESPN_FANTASY
 * MOCK: Clears mock state.
 */
export async function disconnectEspn(): Promise<{ connected: boolean }> {
  return { connected: false };
}

// ---- League / Team data ----

/**
 * // TODO-INTEGRATION: ESPN_FANTASY
 * MOCK: Returns mock league list.
 * Real: Calls ESPN API to list user's fantasy leagues.
 */
export async function getEspnLeagues(): Promise<EspnLeagueSummary[]> {
  if (IS_MOCK) {
    await delay(600);
    return [{ id: mockLeagueFull.id, name: mockLeagueFull.name, teams: 12, season: 2025 }];
  }
  throw new Error('ESPN API not implemented');
}

/**
 * // TODO-INTEGRATION: ESPN_FANTASY
 * MOCK: Returns mock league settings.
 * Real: Calls ESPN league settings endpoint.
 */
export async function getEspnLeagueSettings(_leagueId: string): Promise<LeagueScoringSettings> {
  if (IS_MOCK) {
    await delay(500);
    return mockLeagueFull.scoring;
  }
  throw new Error('ESPN API not implemented');
}

/**
 * // TODO-INTEGRATION: ESPN_FANTASY
 * MOCK: Returns mock league teams.
 */
export async function getEspnLeagueTeams(_leagueId: string): Promise<FantasyTeam[]> {
  if (IS_MOCK) {
    await delay(500);
    return mockLeagueFull.teams;
  }
  throw new Error('ESPN API not implemented');
}

/**
 * // TODO-INTEGRATION: ESPN_FANTASY
 * MOCK: Returns mock roster.
 */
export async function getEspnRoster(_teamId: string): Promise<FantasyRoster> {
  if (IS_MOCK) {
    await delay(500);
    return mockUserTeam.roster;
  }
  throw new Error('ESPN API not implemented');
}

/**
 * // TODO-INTEGRATION: ESPN_FANTASY
 * MOCK: Returns mock full league.
 */
export async function getEspnLeague(_leagueId: string): Promise<FantasyLeague> {
  if (IS_MOCK) {
    await delay(600);
    return mockLeagueFull;
  }
  throw new Error('ESPN API not implemented');
}

/**
 * // TODO-INTEGRATION: ESPN_FANTASY
 * MOCK: Returns mock weekly matchup.
 */
export async function getEspnMatchup(_teamId: string, _week: number): Promise<WeeklyMatchup> {
  if (IS_MOCK) {
    await delay(600);
    return mockWeeklyMatchup;
  }
  throw new Error('ESPN API not implemented');
}

// ---- Backward-compatible export ----

export async function fetchEspnLeague(_leagueId?: string): Promise<FantasyLeague> {
  return getEspnLeague(_leagueId ?? 'mock');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
