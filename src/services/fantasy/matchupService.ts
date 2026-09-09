// Mock service for the weekly matchup analysis engine.

import type { WeeklyMatchup } from '@/types';
import { mockWeeklyMatchup } from '@/mock/data';

/**
 * // TODO-INTEGRATION: WEEKLY_MATCHUP_ANALYSIS
 *
 * FUTURE IMPLEMENTATION:
 * 1. Pull both rosters and scoring settings from the connected fantasy
 *    platform (Yahoo / ESPN / Sleeper).
 * 2. Run projections for every starter on both sides (see PLAYER_STATS).
 * 3. Monte-Carlo or closed-form win probability across projection variance.
 * 4. Optimize the user lineup and surface the best move + a risky upside move.
 *
 * INPUT:  user team id, opponent team id, week number, scoring settings.
 * OUTPUT: WeeklyMatchup — the shape the MatchupCard renders.
 * MOCK REPLACEMENT: analyzeWeeklyMatchup().
 */
export async function analyzeWeeklyMatchup(
  _userTeamId?: string,
  _opponentTeamId?: string,
  _week?: number,
): Promise<WeeklyMatchup> {
  await delay(1400);
  return mockWeeklyMatchup;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
