// Barrel export for the mock service layer.
// Lets components import from a single entry point:
//   import { analyzeRosterScreenshot, findSleeperCandidates } from '@/services/fantasy';
//
// When real implementations replace the mock files, this barrel stays the same.

export { analyzeRosterScreenshot } from './rosterAnalysisService';
export { getPlayerStats, getProjectedPlayers, getPlayerProjection } from './playerStatsService';
export { analyzeWeeklyMatchup } from './matchupService';
export { findSleeperCandidates } from './sleeperService';
export { analyzeTrade, buildBetterTrade } from './tradeService';
export { getWaiverAvailablePlayers } from './waiverService';
export { fetchEspnLeague } from './espnService';
