// Chat tool architecture — typed interfaces for future AI tool/function calling.
// Updated to consume the real fantasy data layer.

import type {
  Player,
  PlayerProjection,
  PlayerWeeklyProjection,
  PlayerFantasyPerformance,
  PlayerRanking,
  PlayerInjury,
  PlayerNews,
  FantasyPlayerProfile,
  WeeklyMatchup,
  SleeperRecommendation,
  TradeAnalysis,
  UploadedRosterAnalysis,
  LeagueScoringSettings,
  ScoringFormat,
} from '@/types';

// ---- Tool status ----

export type ToolStatus = 'ok' | 'not-connected' | 'error';

export interface ToolResult<T> {
  status: ToolStatus;
  message?: string;
  data?: T;
}

// ---- Tool input contracts ----

export interface PlayerSearchInput {
  query: string;
  position?: Player['position'] | null;
  nflTeam?: Player['nflTeam'] | null;
  limit?: number;
}

export interface PlayerInfoInput {
  playerId: string;
}

export interface PlayerProjectionInput {
  playerId: string;
  season?: number;
  week?: number;
  scoringFormat?: ScoringFormat;
}

export interface PlayerPerformanceInput {
  playerId: string;
  season?: number;
  numberOfWeeks?: number;
  scoringFormat?: ScoringFormat;
}

export interface PlayerRankingInput {
  playerId: string;
  week?: number;
  scoringFormat?: ScoringFormat;
}

export interface PlayerInjuryInput {
  playerId: string;
}

export interface PlayerNewsInput {
  playerId: string;
}

export interface PlayerProfileInput {
  playerId: string;
  season?: number;
  week?: number;
  scoringFormat?: ScoringFormat;
}

export interface StartSitInput {
  rosterPlayerIds: string[];
  scoring: LeagueScoringSettings;
  week?: number;
}

export interface WaiverAnalysisInput {
  leagueId: string;
  week?: number;
  position?: Player['position'] | null;
}

export interface TradeAnalysisInput {
  givePlayerIds: string[];
  receivePlayerIds: string[];
  scoring: LeagueScoringSettings;
}

export interface TradeBuilderInput {
  teamId: string;
  leagueId: string;
  targetPosition?: Player['position'] | null;
}

export interface SleeperAnalysisInput {
  leagueId: string;
  week?: number;
}

export interface MatchupAnalysisInput {
  teamId: string;
  opponentTeamId: string;
  week: number;
  scoring: LeagueScoringSettings;
}

export interface RosterAnalysisInput {
  rosterPlayerIds: string[];
  scoring: LeagueScoringSettings;
  week?: number;
}

// ---- Tool output contracts ----

export interface PlayerSearchOutput {
  players: Player[];
}

export interface PlayerInfoOutput {
  player: Player;
  projection: PlayerProjection | null;
}

export interface PlayerProjectionOutput {
  projection: PlayerWeeklyProjection | null;
  available: boolean;
}

export interface PlayerPerformanceOutput {
  performances: PlayerFantasyPerformance[];
  available: boolean;
}

export interface PlayerRankingOutput {
  ranking: PlayerRanking | null;
  available: boolean;
}

export interface PlayerInjuryOutput {
  injury: PlayerInjury | null;
  available: boolean;
}

export interface PlayerNewsOutput {
  news: PlayerNews[];
  available: boolean;
}

export interface PlayerProfileOutput {
  profile: FantasyPlayerProfile;
}

export interface StartSitOutput {
  starters: Player[];
  bench: Player[];
  projections: PlayerWeeklyProjection[];
  injuries: PlayerInjury[];
  rankings: PlayerRanking[];
  reasoning: string;
}

export interface WaiverAnalysisOutput {
  recommendations: SleeperRecommendation[];
}

export interface TradeAnalysisOutput {
  analysis: TradeAnalysis;
}

export interface TradeBuilderOutput {
  proposals: TradeAnalysis[];
}

export interface SleeperAnalysisOutput {
  recommendations: SleeperRecommendation[];
}

export interface MatchupAnalysisOutput {
  matchup: WeeklyMatchup;
}

export interface RosterAnalysisOutput {
  analysis: UploadedRosterAnalysis;
}

// ---- Tool definitions ----

export interface ToolDefinition<I, O> {
  name: string;
  description: string;
  execute: (input: I) => Promise<ToolResult<O>>;
}

// ---- Tool registry ----

export const TOOL_NAMES = {
  PLAYER_SEARCH: 'player_search',
  PLAYER_INFO: 'player_info',
  PLAYER_PROJECTION: 'player_projection',
  PLAYER_PERFORMANCE: 'player_recent_performance',
  PLAYER_RANKINGS: 'player_rankings',
  PLAYER_INJURY: 'player_injury',
  PLAYER_NEWS: 'player_news',
  PLAYER_PROFILE: 'player_profile',
  START_SIT: 'start_sit_analysis',
  WAIVER: 'waiver_analysis',
  TRADE_ANALYSIS: 'trade_analysis',
  TRADE_BUILDER: 'trade_builder',
  SLEEPER: 'sleeper_analysis',
  MATCHUP: 'matchup_analysis',
  ROSTER: 'roster_analysis',
} as const;

// ---- Helpers ----

export function notConnected(toolName: string, message: string): ToolResult<never> {
  return {
    status: 'not-connected',
    message: `[${toolName}] Not connected: ${message}`,
  };
}

export function okResult<T>(data: T, message?: string): ToolResult<T> {
  return { status: 'ok', data, message };
}

export function errorResult(message: string): ToolResult<never> {
  return { status: 'error', message };
}
