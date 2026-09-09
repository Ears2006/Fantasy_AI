// Mock service for NFL player stats and projections.

import type { Player, PlayerProjection } from '@/types';
import { mockPlayers } from '@/mock/data';

const SLEEPER_API = 'https://api.sleeper.app/v1';
const PLAYER_CACHE_KEY = 'fantasy_ai_sleeper_players';
const PLAYER_CACHE_TIME_KEY = 'fantasy_ai_sleeper_players_time';
const PLAYER_CACHE_DURATION = 24 * 60 * 60 * 1000;

interface SleeperPlayer {
  player_id: string;
  first_name: string | null;
  last_name: string | null;
  full_name?: string | null;
  position: string | null;
  fantasy_positions?: string[] | null;
  team: string | null;
  injury_status?: string | null;
  status?: string | null;
}

/**
 * // TODO-INTEGRATION: PLAYER_STATS
 *
 * FUTURE IMPLEMENTATION:
 * 1. Integrate a live NFL stats provider (e.g. a stats API, Sleeper API,
 *    or a projections feed) to pull current season stats, snap counts,
 *    targets, and weekly projections.
 * 2. Cache responses with a TTL to stay within rate limits.
 * 3. Map provider payloads into the shared Player + PlayerProjection types.
 *
 * INPUT:  player id(s) and optionally a week number.
 * OUTPUT: Player / PlayerProjection records the UI can render.*/

export async function getSleeperPlayers(): Promise<Record<string, SleeperPlayer>> {


  const response = await fetch(`${SLEEPER_API}/players/nfl?active=true`);

  if (!response.ok) {
    throw new Error(`Sleeper API failed with status ${response.status}`);
  }

  const players: Record<string, SleeperPlayer> = await response.json();



  return players;
}
function mapSleeperPlayer(player: SleeperPlayer): Player | null {
  if (!player.player_id || !player.position || !player.team) {
    return null;
  }

  const name =
    player.full_name ||
    `${player.first_name ?? ''} ${player.last_name ?? ''}`.trim();

  if (!name) {
    return null;
  }

  return {
    id: player.player_id,
    name,
    position: player.position as Player['position'],
    nflTeam: player.team as Player['nflTeam'],
    injuryTag: player.injury_status ?? undefined,
  };
}
/*
 * MOCK REPLACEMENT: getPlayerStats() and getProjectedPlayers().
 */
export async function getPlayerStats(playerId: string): Promise<Player | null> {
  await delay(300);
  return mockPlayers.find((p) => p.id === playerId) ?? null;
}

/**
 * // TODO-INTEGRATION: PLAYER_STATS
 * Same integration as above. Returns a roster-sized batch of projected
 * players so the roster / lineup views have data to show.
 */
export async function getProjectedPlayers(): Promise<Player[]> {
  const sleeperPlayers = await getSleeperPlayers();

  const players = Object.values(sleeperPlayers)
    .map(mapSleeperPlayer)
    .filter((player): player is Player => player !== null);

  return players;
}

/**
 * // TODO-INTEGRATION: PLAYER_STATS
 * Returns projection detail (projected points, ceiling, floor, confidence)
 * for a single player. Replace with the real projections feed.
 */
export async function getPlayerProjection(playerId: string): Promise<PlayerProjection | null> {
  await delay(200);
  // Lightweight inline projections for the mock shell.
  const table: Record<string, PlayerProjection> = {
    p1: { playerId: 'p1', projectedPoints: 24.8, ceiling: 34.2, floor: 12.5, confidence: 0.85 },
    p2: { playerId: 'p2', projectedPoints: 22.1, ceiling: 31.0, floor: 9.0, confidence: 0.8 },
    p3: { playerId: 'p3', projectedPoints: 21.4, ceiling: 30.5, floor: 11.0, confidence: 0.78 },
    p4: { playerId: 'p4', projectedPoints: 14.2, ceiling: 22.0, floor: 6.0, confidence: 0.74 },
    p5: { playerId: 'p5', projectedPoints: 11.6, ceiling: 20.0, floor: 3.0, confidence: 0.55 },
    p6: { playerId: 'p6', projectedPoints: 17.9, ceiling: 27.0, floor: 8.5, confidence: 0.76 },
    p7: { playerId: 'p7', projectedPoints: 10.1, ceiling: 18.5, floor: 4.0, confidence: 0.6 },
    p8: { playerId: 'p8', projectedPoints: 7.4, ceiling: 15.0, floor: 2.0, confidence: 0.5 },
    p9: { playerId: 'p9', projectedPoints: 8.2, ceiling: 19.0, floor: 2.5, confidence: 0.62 },
    p10: { playerId: 'p10', projectedPoints: 6.8, ceiling: 14.0, floor: 1.5, confidence: 0.58 },
    p11: { playerId: 'p11', projectedPoints: 9.0, ceiling: 14.0, floor: 4.0, confidence: 0.7 },
    p12: { playerId: 'p12', projectedPoints: 8.5, ceiling: 16.0, floor: 1.0, confidence: 0.68 },
  };
  return table[playerId] ?? null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
