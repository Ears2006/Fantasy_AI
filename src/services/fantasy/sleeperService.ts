// Mock service for the sleeper recommendation engine.

import type { SleeperRecommendation } from '@/types';
import { mockSleepers } from '@/mock/data';

/**
 * // TODO-INTEGRATION: SLEEPER_ENGINE
 *
 * FUTURE IMPLEMENTATION:
 * 1. Pull waiver/free-agent pool from the connected platform (see
 *    WAIVER_AVAILABILITY) and every roster to identify buy-low/sell-high
 *    candidates.
 * 2. Score each candidate on opportunity (snap share, targets, carries),
 *    matchup (opponent EPA), and upside (red-zone / big-play rate).
 * 3. Use the AI model to generate reasoning text and a confidence score.
 *
 * INPUT:  league id, week, roster context, scoring settings.
 * OUTPUT: SleeperRecommendation[] — the shape the SleeperCard renders.
 * MOCK REPLACEMENT: findSleeperCandidates().
 */
export async function findSleeperCandidates(
  _leagueId?: string,
  _week?: number,
): Promise<SleeperRecommendation[]> {
  await delay(1200);
  return mockSleepers;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
