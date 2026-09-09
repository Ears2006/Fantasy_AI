// Chat tool architecture — typed interfaces for future AI tool/function calling.
// The future AI model will invoke these tools to gather data and perform
// analysis. Each tool has a typed input contract and output contract.
//
// No tool here produces fake analysis results. Unfinished tools return
// an explicit "not connected" status so the AI (and the user) knows the
// capability isn't available yet.
//
// These tools are framework-agnostic — they do not import React components
// or UI types. The AI service calls them, then the chat layer maps the
// results into ChatMessage card payloads.

import type {
  Player,
  PlayerProjection,
  WeeklyMatchup,
  SleeperRecommendation,
  TradeAnalysis,
  UploadedRosterAnalysis,
  LeagueScoringSettings,
  FantasyTeam,
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

export interface StartSitOutput {
  starters: Player[];
  bench: Player[];
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
// Each tool is registered here. Real implementations replace the stubs.
// The AI service imports this registry to know which tools are available.

export const TOOL_NAMES = {
  PLAYER_SEARCH: 'player_search',
  PLAYER_INFO: 'player_info',
  START_SIT: 'start_sit_analysis',
  WAIVER: 'waiver_analysis',
  TRADE_ANALYSIS: 'trade_analysis',
  TRADE_BUILDER: 'trade_builder',
  SLEEPER: 'sleeper_analysis',
  MATCHUP: 'matchup_analysis',
  ROSTER: 'roster_analysis',
} as const;

// ---- Helper for not-connected results ----

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

// ---- Type re-exports for the AI service ----

export type {
  Player,
  PlayerProjection,
  WeeklyMatchup,
  SleeperRecommendation,
  TradeAnalysis,
  UploadedRosterAnalysis,
  LeagueScoringSettings,
  FantasyTeam,
};
