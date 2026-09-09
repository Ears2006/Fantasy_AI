// Yahoo Fantasy Sports service — REAL implementation.
// Replaces the previous mock service.
//
// This module is the provider-neutral adapter that components call.
// It delegates to yahooApi.ts (HTTP) and yahooMapper.ts (data transformation).
//
// OAuth tokens are stored server-side and never exposed to the frontend.
// The browser is tracked via an HTTP-only session cookie managed by the edge function.
//
// // TODO-INTEGRATION: YAHOO_FANTASY
// To activate: set YAHOO_CLIENT_ID and YAHOO_CLIENT_SECRET secrets on Supabase.
// Register the callback URL in your Yahoo Developer app (see docs/INTEGRATION_ROADMAP.md).

import type {
  YahooConnection,
  ProviderLeague,
  ProviderTeam,
  ProviderRosterEntry,
  ProviderMatchup,
  YahooLeagueSettings,
  CrosswalkDiagnostic,
  Player,
  LeagueScoringSettings,
} from '@/types';
import {
  getAuthStartUrl,
  fetchAuthStatus,
  disconnectYahoo as apiDisconnect,
  fetchYahooLeagues,
  fetchYahooLeagueSettings,
  fetchYahooLeagueTeams,
  fetchYahooUserTeam,
  fetchYahooRoster,
  fetchYahooMatchup,
  fetchYahooLeaguePlayers,
  YahooApiError,
  type YahooAuthStatusResponse,
} from './yahooApi';
import {
  mapYahooLeagues,
  mapYahooLeagueSettings,
  mapYahooTeams,
  mapYahooUserTeam,
  mapYahooRoster,
  mapYahooMatchup,
} from './yahooMapper';
import { getCurrentSeason } from '@/services/utils/season';
import { getAllPlayers } from '@/services/sleeper/sleeperService';
import { normalizePosition, normalizeTeam } from '@/services/fantasyData/fantasyDataMapper';

// ---- OAuth ----

/**
 * Opens the Yahoo OAuth authorization page in a popup window.
 * Returns a promise that resolves when the popup sends a callback message.
 */
export function connectYahoo(): Promise<YahooConnection> {
  return new Promise((resolve, reject) => {
    const authUrl = getAuthStartUrl();
    const popup = window.open(authUrl, 'yahoo-auth', 'width=600,height=700,scrollbars=yes');

    if (!popup) {
      reject(new Error('Popup blocked. Please allow popups for Yahoo authentication.'));
      return;
    }

    const messageHandler = (event: MessageEvent) => {
      if (event.data?.type !== 'yahoo-callback') return;
      window.removeEventListener('message', messageHandler);
      clearTimeout(timeoutId);

      if (event.data.error) {
        reject(new Error(`Yahoo authentication failed: ${event.data.error}`));
      } else if (event.data.success) {
        // Check status to get connection details
        checkConnectionStatus().then(resolve).catch(reject);
      } else {
        reject(new Error('Yahoo authentication failed: unknown error'));
      }
    };

    window.addEventListener('message', messageHandler);
    const timeoutId = setTimeout(() => {
      window.removeEventListener('message', messageHandler);
      if (!popup.closed) popup.close();
      reject(new Error('Yahoo authentication timed out.'));
    }, 120000); // 2 minute timeout
  });
}

/**
 * Checks the current Yahoo connection status by calling the edge function.
 */
export async function checkConnectionStatus(): Promise<YahooConnection> {
  try {
    const status = await fetchAuthStatus();
    return mapStatusResponse(status);
  } catch {
    return {
      connected: false,
      status: 'error',
      error: 'Failed to check Yahoo connection status.',
    };
  }
}

/**
 * Disconnects Yahoo — deletes stored tokens server-side.
 */
export async function disconnectYahoo(): Promise<YahooConnection> {
  try {
    await apiDisconnect();
    return { connected: false, status: 'disconnected' };
  } catch {
    return { connected: false, status: 'error', error: 'Failed to disconnect Yahoo.' };
  }
}

function mapStatusResponse(status: YahooAuthStatusResponse): YahooConnection {
  if (!status.configured) {
    return { connected: false, status: 'not_configured' };
  }
  return {
    connected: status.connected,
    status: status.status as YahooConnection['status'],
    yahooGuid: status.yahooGuid,
  };
}

// ---- League discovery ----

export async function getYahooLeagues(season?: number): Promise<ProviderLeague[]> {
  try {
    const raw = await fetchYahooLeagues(season ?? getCurrentSeason());
    return mapYahooLeagues(raw);
  } catch (e) {
    if (e instanceof YahooApiError && e.status === 401) {
      throw new Error('Yahoo connection expired. Please reconnect Yahoo.');
    }
    throw new Error(`Failed to fetch Yahoo leagues: ${e instanceof Error ? e.message : 'unknown error'}`);
  }
}

// ---- League settings ----

export async function getYahooLeagueSettings(leagueKey: string): Promise<YahooLeagueSettings> {
  try {
    const raw = await fetchYahooLeagueSettings(leagueKey);
    return mapYahooLeagueSettings(raw);
  } catch (e) {
    if (e instanceof YahooApiError && e.status === 401) {
      throw new Error('Yahoo connection expired. Please reconnect Yahoo.');
    }
    throw new Error(`Failed to fetch Yahoo league settings: ${e instanceof Error ? e.message : 'unknown error'}`);
  }
}

// ---- League teams ----

export async function getYahooLeagueTeams(leagueKey: string): Promise<ProviderTeam[]> {
  try {
    const raw = await fetchYahooLeagueTeams(leagueKey);
    const teams = mapYahooTeams(raw);
    // Fill in the league ID for each team
    return teams.map(t => ({ ...t, providerLeagueId: leagueKey }));
  } catch (e) {
    if (e instanceof YahooApiError && e.status === 401) {
      throw new Error('Yahoo connection expired. Please reconnect Yahoo.');
    }
    throw new Error(`Failed to fetch Yahoo league teams: ${e instanceof Error ? e.message : 'unknown error'}`);
  }
}

// ---- User team ----

export async function getYahooUserTeam(leagueKey: string): Promise<ProviderTeam | null> {
  try {
    const raw = await fetchYahooUserTeam(leagueKey);
    const team = mapYahooUserTeam(raw);
    if (!team) return null;
    return { ...team, providerLeagueId: leagueKey };
  } catch (e) {
    if (e instanceof YahooApiError && e.status === 401) {
      throw new Error('Yahoo connection expired. Please reconnect Yahoo.');
    }
    throw new Error(`Failed to fetch user team: ${e instanceof Error ? e.message : 'unknown error'}`);
  }
}

// ---- Roster ----

export async function getYahooRoster(teamKey: string, week?: number): Promise<ProviderRosterEntry[]> {
  try {
    const raw = await fetchYahooRoster(teamKey, week);
    return mapYahooRoster(raw);
  } catch (e) {
    if (e instanceof YahooApiError && e.status === 401) {
      throw new Error('Yahoo connection expired. Please reconnect Yahoo.');
    }
    throw new Error(`Failed to fetch Yahoo roster: ${e instanceof Error ? e.message : 'unknown error'}`);
  }
}

// ---- Matchup ----

export async function getYahooMatchup(teamKey: string, week?: number): Promise<ProviderMatchup | null> {
  try {
    const raw = await fetchYahooMatchup(teamKey, week);
    return mapYahooMatchup(raw);
  } catch (e) {
    if (e instanceof YahooApiError && e.status === 401) {
      throw new Error('Yahoo connection expired. Please reconnect Yahoo.');
    }
    throw new Error(`Failed to fetch Yahoo matchup: ${e instanceof Error ? e.message : 'unknown error'}`);
  }
}

// ---- Player crosswalk (Yahoo -> Sleeper) ----

export interface YahooRosterWithPlayers extends ProviderRosterEntry {
  sleeperPlayerId: string | null;
  player: Player | null;
}

/**
 * Maps Yahoo roster entries to Sleeper players using name + team + position matching.
 * Returns diagnostics showing how many players were matched, unmatched, or ambiguous.
 */
export async function crosswalkYahooRoster(
  roster: ProviderRosterEntry[],
): Promise<{ players: YahooRosterWithPlayers[]; diagnostic: CrosswalkDiagnostic }> {
  const sleeperPlayers = await getAllPlayers();

  // Build lookup indexes
  const byNameTeamPos = new Map<string, Player>();
  const byNamePos = new Map<string, Player[]>();

  for (const p of sleeperPlayers) {
    const nameKey = normalizeName(p.name);
    byNameTeamPos.set(`${nameKey}|${p.nflTeam}|${p.position}`, p);

    const namePosKey = `${nameKey}|${p.position}`;
    const existing = byNamePos.get(namePosKey);
    if (existing) existing.push(p);
    else byNamePos.set(namePosKey, [p]);
  }

  let directlyMatched = 0;
  let matchedByName = 0;
  let unmatched = 0;
  let ambiguous = 0;
  const unmatchedPlayers: string[] = [];

  const result: YahooRosterWithPlayers[] = roster.map((entry) => {
    const nameKey = normalizeName(entry.playerName);
    const team = normalizeTeam(entry.nflTeam);
    const pos = normalizePosition(entry.position);

    // Strategy 1: exact name + team + position
    let matchedPlayer: Player | null = null;
    if (team && pos) {
      const key = `${nameKey}|${team}|${pos}`;
      matchedPlayer = byNameTeamPos.get(key) ?? null;
      if (matchedPlayer) directlyMatched++;
    }

    // Strategy 2: exact name + position
    if (!matchedPlayer && pos) {
      const key = `${nameKey}|${pos}`;
      const candidates = byNamePos.get(key);
      if (candidates && candidates.length === 1) {
        matchedPlayer = candidates[0];
        matchedByName++;
      } else if (candidates && candidates.length > 1) {
        ambiguous++;
      }
    }

    if (!matchedPlayer) {
      unmatched++;
      unmatchedPlayers.push(entry.playerName);
    }

    return {
      ...entry,
      sleeperPlayerId: matchedPlayer?.id ?? null,
      player: matchedPlayer,
    };
  });

  return {
    players: result,
    diagnostic: {
      totalProviderPlayers: roster.length,
      directlyMatched,
      matchedByName,
      unmatched,
      ambiguous,
      unmatchedPlayers,
    },
  };
}

// ---- Ownership / waiver foundation ----

/**
 * Fetches all players in a Yahoo league to determine ownership status.
 * This is the foundation for future waiver recommendations.
 *
 * Note: The Yahoo Fantasy API's /league/{key}/players endpoint may return
 * a large dataset. The free tier may limit this. See docs for limitations.
 */
export async function getYahooLeaguePlayerOwnership(leagueKey: string): Promise<unknown> {
  try {
    return await fetchYahooLeaguePlayers(leagueKey);
  } catch (e) {
    if (e instanceof YahooApiError && e.status === 401) {
      throw new Error('Yahoo connection expired. Please reconnect Yahoo.');
    }
    throw new Error(`Failed to fetch Yahoo league players: ${e instanceof Error ? e.message : 'unknown error'}`);
  }
}

// ---- Legacy compatibility ----
// These aliases keep the old import paths working during the transition.

export { connectYahoo as connectYahooFantasy };
export { disconnectYahoo as disconnectYahooFantasy };

// ---- Helpers ----

function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\./g, '').replace(/\s+/g, ' ');
}

// ---- Synchronous status (for initial render) ----

let cachedStatus: YahooConnection | null = null;

export function getCachedYahooStatus(): YahooConnection | null {
  return cachedStatus;
}

export function setCachedYahooStatus(status: YahooConnection | null): void {
  cachedStatus = status;
}

// ---- Scoring format helper ----

export function inferScoringFormat(settings: LeagueScoringSettings): 'Standard' | 'Half-PPR' | 'Full-PPR' {
  if (settings.receptionPoints >= 1) return 'Full-PPR';
  if (settings.receptionPoints === 0.5) return 'Half-PPR';
  return 'Standard';
}
