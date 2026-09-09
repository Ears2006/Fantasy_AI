// Yahoo Fantasy Sports adapter layer.
//
// This file defines the clean interface that the UI and AI tools call.
// The current implementation is MOCK — all functions return fake data
// and are clearly labeled. When real Yahoo OAuth is connected, only
// the internal function bodies change; the signatures and return types
// stay the same.
//
// // TODO-INTEGRATION: YAHOO_FANTASY
//
// FUTURE IMPLEMENTATION:
// 1. Redirect the user through Yahoo OAuth 2.0 (PKCE flow via a Supabase
//    Edge Function that handles the token exchange).
// 2. Store refresh tokens securely in Supabase vault / edge function env.
// 3. Call Yahoo Fantasy API resources:
//    - game.meta / game.league / league.settings
//    - league.teams / team.roster / league.standings
//    - league.matchup
// 4. Map Yahoo payloads into the shared types via a yahooMapper module.
// 5. Persist league data in Supabase tables with RLS.
//
// No API keys or secrets are stored in this file.

import type {
  FantasyLeague,
  FantasyRoster,
  FantasyTeam,
  LeagueScoringSettings,
  WeeklyMatchup,
  YahooConnection,
  ScoringFormat,
} from '@/types';
import { mockLeagueFull, mockUserTeam, mockWeeklyMatchup } from '@/mock/data';

const IS_MOCK = true;

// ---- Connection ----

/**
 * // TODO-INTEGRATION: YAHOO_FANTASY
 * MOCK: Simulates a Yahoo OAuth connection.
 * Real: Triggers OAuth redirect, exchanges code for tokens, fetches user games.
 */
export async function connectYahoo(): Promise<YahooConnection> {
  if (IS_MOCK) {
    await delay(900);
    return {
      connected: true,
      leagueName: 'Example League',
      format: 'Half-PPR',
      rosterCount: 17,
    };
  }
  // Real implementation would redirect to Yahoo OAuth here.
  throw new Error('Yahoo OAuth not implemented');
}

/**
 * // TODO-INTEGRATION: YAHOO_FANTASY
 * MOCK: Clears mock connection state.
 * Real: Revokes tokens and clears stored credentials.
 */
export async function disconnectYahoo(): Promise<YahooConnection> {
  await delay(400);
  return { connected: false };
}

/**
 * // TODO-INTEGRATION: YAHOO_FANTASY
 * Returns the current connection status.
 */
export function getConnectionStatus(): YahooConnection {
  return { connected: false };
}

// ---- League / Team data ----

export interface YahooLeagueSummary {
  id: string;
  name: string;
  format: ScoringFormat;
  teams: number;
}

/**
 * // TODO-INTEGRATION: YAHOO_FANTASY
 * MOCK: Returns a fake league list.
 * Real: Calls Yahoo API to list the user's fantasy leagues for the current season.
 */
export async function getYahooLeagues(): Promise<YahooLeagueSummary[]> {
  if (IS_MOCK) {
    await delay(600);
    return [{ id: mockLeagueFull.id, name: mockLeagueFull.name, format: 'Half-PPR', teams: 12 }];
  }
  throw new Error('Yahoo API not implemented');
}

/**
 * // TODO-INTEGRATION: YAHOO_FANTASY
 * MOCK: Returns mock league settings.
 * Real: Calls Yahoo league.settings resource.
 */
export async function getYahooLeagueSettings(_leagueId: string): Promise<LeagueScoringSettings> {
  if (IS_MOCK) {
    await delay(500);
    return mockLeagueFull.scoring;
  }
  throw new Error('Yahoo API not implemented');
}

/**
 * // TODO-INTEGRATION: YAHOO_FANTASY
 * MOCK: Returns mock league teams.
 * Real: Calls Yahoo league.teams resource.
 */
export async function getYahooLeagueTeams(_leagueId: string): Promise<FantasyTeam[]> {
  if (IS_MOCK) {
    await delay(500);
    return mockLeagueFull.teams;
  }
  throw new Error('Yahoo API not implemented');
}

/**
 * // TODO-INTEGRATION: YAHOO_FANTASY
 * MOCK: Returns mock user roster.
 * Real: Calls Yahoo team.roster resource and maps to FantasyRoster.
 */
export async function getYahooRoster(_teamId: string): Promise<FantasyRoster> {
  if (IS_MOCK) {
    await delay(500);
    return mockUserTeam.roster;
  }
  throw new Error('Yahoo API not implemented');
}

/**
 * // TODO-INTEGRATION: YAHOO_FANTASY
 * MOCK: Returns mock full league.
 * Real: Combines league settings + teams + rosters into a FantasyLeague.
 */
export async function getYahooLeague(_leagueId: string): Promise<FantasyLeague> {
  if (IS_MOCK) {
    await delay(600);
    return mockLeagueFull;
  }
  throw new Error('Yahoo API not implemented');
}

/**
 * // TODO-INTEGRATION: YAHOO_FANTASY
 * MOCK: Returns mock weekly matchup.
 * Real: Calls Yahoo league.matchup resource for the given week.
 */
export async function getYahooMatchup(_teamId: string, _week: number): Promise<WeeklyMatchup> {
  if (IS_MOCK) {
    await delay(600);
    return mockWeeklyMatchup;
  }
  throw new Error('Yahoo API not implemented');
}

// ---- Backward-compatible exports for existing callers ----

export const connectYahooFantasy = connectYahoo;
export const disconnectYahooFantasy = disconnectYahoo;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
