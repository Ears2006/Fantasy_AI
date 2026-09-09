// Tool implementations — the bridge between the AI tool registry and
// the service layer. Real tools call the Sleeper service; unfinished
// analysis tools return an explicit "not-connected" status.
//
// The future AI service calls these without importing any React components.

import { searchPlayers } from '@/services/sleeper/playerSearch';
import { getPlayerById } from '@/services/sleeper/sleeperService';
import { getPlayerProjection } from '@/services/fantasy/playerStatsService';
import type {
  PlayerSearchInput,
  PlayerSearchOutput,
  PlayerInfoInput,
  PlayerInfoOutput,
  StartSitInput,
  StartSitOutput,
  WaiverAnalysisInput,
  WaiverAnalysisOutput,
  TradeAnalysisInput,
  TradeAnalysisOutput,
  TradeBuilderInput,
  TradeBuilderOutput,
  SleeperAnalysisInput,
  SleeperAnalysisOutput,
  MatchupAnalysisInput,
  MatchupAnalysisOutput,
  RosterAnalysisInput,
  RosterAnalysisOutput,
  ToolResult,
  ToolDefinition,
} from './toolDefinitions';
import { notConnected, okResult, errorResult, TOOL_NAMES } from './toolDefinitions';

// ---- REAL: player_search ----

export const playerSearchTool: ToolDefinition<PlayerSearchInput, PlayerSearchOutput> = {
  name: TOOL_NAMES.PLAYER_SEARCH,
  description: 'Search for NFL players by name with optional position and team filters.',
  async execute(input: PlayerSearchInput): Promise<ToolResult<PlayerSearchOutput>> {
    try {
      const results = await searchPlayers({
        query: input.query,
        position: input.position ?? null,
        nflTeam: input.nflTeam ?? null,
        limit: input.limit ?? 15,
      });
      return okResult({ players: results.map((r) => r.player) });
    } catch (e) {
      return errorResult(`Player search failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    }
  },
};

// ---- REAL: player_info ----

export const playerInfoTool: ToolDefinition<PlayerInfoInput, PlayerInfoOutput> = {
  name: TOOL_NAMES.PLAYER_INFO,
  description: 'Get detailed player info and projection by Sleeper player ID.',
  async execute(input: PlayerInfoInput): Promise<ToolResult<PlayerInfoOutput>> {
    try {
      const player = await getPlayerById(input.playerId);
      if (!player) return errorResult(`Player not found: ${input.playerId}`);
      // TODO-INTEGRATION: PLAYER_PROJECTIONS — projection is mock
      const projection = await getPlayerProjection(input.playerId);
      return okResult({ player, projection });
    } catch (e) {
      return errorResult(`Player info failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    }
  },
};

// ---- NOT CONNECTED: start_sit_analysis ----
// TODO-INTEGRATION: AI_MODEL — requires AI model + projections feed

export const startSitTool: ToolDefinition<StartSitInput, StartSitOutput> = {
  name: TOOL_NAMES.START_SIT,
  description: 'Analyze a roster and produce start/sit recommendations.',
  async execute(_input: StartSitInput): Promise<ToolResult<StartSitOutput>> {
    return notConnected(
      TOOL_NAMES.START_SIT,
      'Start/sit analysis requires an AI model and a projections feed. Neither is connected yet.',
    );
  },
};

// ---- NOT CONNECTED: waiver_analysis ----
// TODO-INTEGRATION: WAIVER_AVAILABILITY + SLEEPER_ENGINE

export const waiverTool: ToolDefinition<WaiverAnalysisInput, WaiverAnalysisOutput> = {
  name: TOOL_NAMES.WAIVER,
  description: 'Analyze waiver wire for sleeper and free agent targets.',
  async execute(_input: WaiverAnalysisInput): Promise<ToolResult<WaiverAnalysisOutput>> {
    return notConnected(
      TOOL_NAMES.WAIVER,
      'Waiver analysis requires a waiver availability feed and the sleeper engine. Neither is connected yet.',
    );
  },
};

// ---- NOT CONNECTED: trade_analysis ----
// TODO-INTEGRATION: TRADE_ENGINE

export const tradeAnalysisTool: ToolDefinition<TradeAnalysisInput, TradeAnalysisOutput> = {
  name: TOOL_NAMES.TRADE_ANALYSIS,
  description: 'Analyze a trade proposal for fairness and expected value.',
  async execute(_input: TradeAnalysisInput): Promise<ToolResult<TradeAnalysisOutput>> {
    return notConnected(
      TOOL_NAMES.TRADE_ANALYSIS,
      'Trade analysis requires the trade engine and a projections feed. Neither is connected yet.',
    );
  },
};

// ---- NOT CONNECTED: trade_builder ----
// TODO-INTEGRATION: TRADE_ENGINE

export const tradeBuilderTool: ToolDefinition<TradeBuilderInput, TradeBuilderOutput> = {
  name: TOOL_NAMES.TRADE_BUILDER,
  description: 'Generate trade proposals that improve the user roster.',
  async execute(_input: TradeBuilderInput): Promise<ToolResult<TradeBuilderOutput>> {
    return notConnected(
      TOOL_NAMES.TRADE_BUILDER,
      'Trade builder requires the trade engine and league roster data. Neither is connected yet.',
    );
  },
};

// ---- NOT CONNECTED: sleeper_analysis ----
// TODO-INTEGRATION: SLEEPER_ENGINE

export const sleeperTool: ToolDefinition<SleeperAnalysisInput, SleeperAnalysisOutput> = {
  name: TOOL_NAMES.SLEEPER,
  description: 'Find sleeper candidates with AI upside projections.',
  async execute(_input: SleeperAnalysisInput): Promise<ToolResult<SleeperAnalysisOutput>> {
    return notConnected(
      TOOL_NAMES.SLEEPER,
      'Sleeper analysis requires the sleeper engine and a projections feed. Neither is connected yet.',
    );
  },
};

// ---- NOT CONNECTED: matchup_analysis ----
// TODO-INTEGRATION: WEEKLY_MATCHUP_ANALYSIS

export const matchupTool: ToolDefinition<MatchupAnalysisInput, MatchupAnalysisOutput> = {
  name: TOOL_NAMES.MATCHUP,
  description: 'Analyze a weekly matchup with win probability and lineup moves.',
  async execute(_input: MatchupAnalysisInput): Promise<ToolResult<MatchupAnalysisOutput>> {
    return notConnected(
      TOOL_NAMES.MATCHUP,
      'Matchup analysis requires a projections feed and the matchup engine. Neither is connected yet.',
    );
  },
};

// ---- NOT CONNECTED: roster_analysis ----
// TODO-INTEGRATION: ROSTER_SCREENSHOT_ANALYSIS + AI_MODEL

export const rosterTool: ToolDefinition<RosterAnalysisInput, RosterAnalysisOutput> = {
  name: TOOL_NAMES.ROSTER,
  description: 'Analyze a roster for strengths, weaknesses, and recommendations.',
  async execute(_input: RosterAnalysisInput): Promise<ToolResult<RosterAnalysisOutput>> {
    return notConnected(
      TOOL_NAMES.ROSTER,
      'Roster analysis requires an AI model and a projections feed. Neither is connected yet.',
    );
  },
};

// ---- Tool registry ----

export const allTools = [
  playerSearchTool,
  playerInfoTool,
  startSitTool,
  waiverTool,
  tradeAnalysisTool,
  tradeBuilderTool,
  sleeperTool,
  matchupTool,
  rosterTool,
];
