// Player stats / projections service.
// Player identity data is now REAL — fetched from Sleeper API and cached
// in IndexedDB. Projections are still mock (see TODO-INTEGRATION below).

import type { Player, PlayerProjection } from '@/types';
import { getPlayerById, getAllPlayers, getCacheInfo, refreshPlayerCache } from '@/services/sleeper/sleeperService';

// Re-export so existing imports from this file still work.
export { getAllPlayers as getProjectedPlayers, getCacheInfo, refreshPlayerCache };

/**
 * Returns a single player by Sleeper player ID using real Sleeper data.
 * No longer falls back to mockPlayers.
 */
export async function getPlayerStats(playerId: string): Promise<Player | null> {
  try {
    return await getPlayerById(playerId);
  } catch {
    return null;
  }
}

/**
 * // TODO-INTEGRATION: PLAYER_STATS
 *
 * FUTURE IMPLEMENTATION:
 * 1. Integrate a stats/projections provider to pull current season stats,
 *    snap counts, targets, and weekly projections for a given player + week.
 * 2. Cache responses with a TTL.
 * 3. Map provider payloads into the PlayerProjection type.
 *
 * INPUT:  player id, optional week number.
 * OUTPUT: PlayerProjection | null
 *
 * Currently returns a deterministic mock projection derived from the
 * player ID so the UI has plausible numbers to display. This is clearly
 * labeled mock data — replace with a real projections feed.
 */
export async function getPlayerProjection(playerId: string): Promise<PlayerProjection | null> {
  // Deterministic mock projection based on player ID hash.
  // This ensures the same player always gets the same projection
  // without storing a static table.
  const hash = simpleHash(playerId);
  const projectedPoints = 5 + (hash % 25); // 5-30 range
  const ceiling = projectedPoints + 5 + (hash % 8);
  const floor = Math.max(1, projectedPoints - 4 - (hash % 5));
  const confidence = 0.5 + ((hash % 30) / 100); // 0.5-0.8 range

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
