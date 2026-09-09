// Mock service for the trade recommendation engine.

import type { TradeAnalysis } from '@/types';
import { mockTradeAnalysis, mockTradeAnalysis2 } from '@/mock/data';

/**
 * // TODO-INTEGRATION: TRADE_ENGINE
 *
 * FUTURE IMPLEMENTATION:
 * 1. Pull all rosters in the league from the connected platform.
 * 2. Identify each team's positional surpluses / needs.
 * 3. Value every player with season-long + weekly projections (PLAYER_STATS).
 * 4. Generate trade proposals that improve the user's expected weekly total
 *    while staying within a fairness band the opponent would accept.
 * 5. Estimate acceptance likelihood from roster need fit + value balance.
 *
 * INPUT:  user team id, league id, optional seed players to give/receive.
 * OUTPUT: TradeAnalysis — the shape the TradeCard renders.
 * MOCK REPLACEMENT: analyzeTrade() and buildBetterTrade().
 */
export async function analyzeTrade(
  _youGiveIds?: string[],
  _youReceiveIds?: string[],
): Promise<TradeAnalysis> {
  await delay(1400);
  return mockTradeAnalysis;
}

/**
 * // TODO-INTEGRATION: TRADE_ENGINE
 * Generates an alternative trade for the "Build Better Trade" button.
 * Replace with the real engine's second-pass proposal generator.
 */
export async function buildBetterTrade(): Promise<TradeAnalysis> {
  await delay(1400);
  return mockTradeAnalysis2;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
