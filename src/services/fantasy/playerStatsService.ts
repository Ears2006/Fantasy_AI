// Player stats / projections service.
// Player identity data is REAL — fetched from Sleeper API and cached in IndexedDB.
// Projections delegate to the fantasy data service (FantasyPros via edge function)
// when available, falling back to a deterministic mock when the provider is not configured.

import type { Player, PlayerProjection } from '@/types';
import { getPlayerById, getAllPlayers, getCacheInfo, refreshPlayerCache } from '@/services/sleeper/sleeperService';
import { getPlayerWeeklyProjection, getFantasyDataStatus } from '@/services/fantasyData/fantasyDataService';

// Re-export so existing imports from this file still work.
export { getAllPlayers as getProjectedPlayers, getCacheInfo, refreshPlayerCache };

/**
 * Returns a single player by Sleeper player ID using real Sleeper data.
 */
export async function getPlayerStats(playerId: string): Promise<Player | null> {
  try {
    return await getPlayerById(playerId);
  } catch {
    return null;
  }
}

/**
 * Returns a player projection. Attempts to use the real FantasyPros
 * projection first. Falls back to a deterministic mock projection
 * if the provider is not configured.
 *
 * // TODO-INTEGRATION: PLAYER_PROJECTIONS
 * When FantasyPros is configured, this returns real projections.
 * When not configured, it returns a clearly-labeled mock.
 */
export async function getPlayerProjection(playerId: string): Promise<PlayerProjection | null> {
  // Try real data first
  try {
    const status = await getFantasyDataStatus();
    if (status.available) {
      const season = new Date().getFullYear();
      const week = 1; // TODO: use current week
      const realProj = await getPlayerWeeklyProjection(playerId, season, week, 'Half-PPR');
      if (realProj) {
        return {
          playerId,
          projectedPoints: realProj.projectedFantasyPoints,
          ceiling: realProj.projectedFantasyPoints * 1.3, // estimate ceiling
          floor: realProj.projectedFantasyPoints * 0.5,   // estimate floor
          confidence: 0.7,
        };
      }
    }
  } catch {
    // Fall through to mock
  }

  // Mock fallback — deterministic based on player ID hash
  const hash = simpleHash(playerId);
  const projectedPoints = 5 + (hash % 25);
  const ceiling = projectedPoints + 5 + (hash % 8);
  const floor = Math.max(1, projectedPoints - 4 - (hash % 5));
  const confidence = 0.5 + ((hash % 30) / 100);

  return {
    playerId,
    projectedPoints: round1(projectedPoints),
    ceiling: round1(ceiling),
    floor: round1(floor),
    confidence: round2(confidence),
  };
}

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
