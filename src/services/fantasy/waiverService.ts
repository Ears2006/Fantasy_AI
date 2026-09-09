// Mock service for waiver availability lookups.

import type { Player } from '@/types';
import { mockPlayers } from '@/mock/data';

/**
 * // TODO-INTEGRATION: WAIVER_AVAILABILITY
 *
 * FUTURE IMPLEMENTATION:
 * 1. Query the connected platform's free-agent / waiver pool (Yahoo, ESPN,
 *    Sleeper) for players not on any roster.
 * 2. Filter by position, bye week, and ownership percentage.
 * 3. Return players the sleeper engine can score.
 *
 * INPUT:  league id, position filter, week.
 * OUTPUT: Player[] of available free agents.
 * MOCK REPLACEMENT: getWaiverAvailablePlayers().
 */
export async function getWaiverAvailablePlayers(
  _leagueId?: string,
  _position?: Player['position'],
): Promise<Player[]> {
  await delay(500);
  return mockPlayers.filter((p) => p.status === 'Sleeper' || p.status === 'Consider Alternatives');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
