// Mock ESPN Fantasy integration service.
// Stubbed so a future developer can wire up the ESPN Fantasy API without
// searching the codebase for where to add it.

import type { FantasyLeague } from '@/types';
import { mockLeagueFull } from '@/mock/data';

/**
 * // TODO-INTEGRATION: ESPN_FANTASY
 *
 * FUTURE IMPLEMENTATION:
 * 1. Authenticate against the ESPN Fantasy API (private cookie / SWID / ESPN_S2
 *    tokens for private leagues, public for public leagues).
 * 2. Pull league settings, teams, rosters, and standings.
 * 3. Map ESPN payloads into the shared FantasyLeague / FantasyTeam types.
 *
 * INPUT:  league id, optional season year.
 * OUTPUT: FantasyLeague — the shape the League page renders.
 * MOCK REPLACEMENT: fetchEspnLeague().
 */
export async function fetchEspnLeague(_leagueId?: string): Promise<FantasyLeague> {
  await delay(600);
  return mockLeagueFull;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
