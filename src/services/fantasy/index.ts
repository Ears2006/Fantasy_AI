// Barrel export for the fantasy service layer.
// Player identity data comes from the Sleeper service (real data).
// Projections and analysis engines are still mock.

export { getPlayerStats, getPlayerProjection } from './playerStatsService';
export { analyzeRosterScreenshot } from './rosterAnalysisService';
export { analyzeWeeklyMatchup } from './matchupService';
export { findSleeperCandidates } from './sleeperService';
export { analyzeTrade, buildBetterTrade } from './tradeService';
export { getWaiverAvailablePlayers } from './waiverService';
export { fetchEspnLeague } from './espnService';
