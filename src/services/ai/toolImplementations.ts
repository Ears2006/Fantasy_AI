// Tool implementations — the bridge between the AI tool registry and
// the service layer. Real tools call the Sleeper + FantasyPros services.
// Analysis tools (start/sit, trade, etc.) gather real data context but
// return "reasoning engine not connected" since the AI model isn't connected.

import { searchPlayers } from '@/services/sleeper/playerSearch';
import { getPlayerById } from '@/services/sleeper/sleeperService';
import { getPlayerProjection } from '@/services/fantasy/playerStatsService';
import {
  getPlayerWeeklyProjection,
  getRecentFantasyPerformance,
  getPlayerRanking,
  getPlayerInjury,
  getPlayerNews,
  getPlayerFantasyProfile,
  getFantasyDataStatus,
  getCurrentInjuries,
} from '@/services/fantasyData/fantasyDataService';
import type {
  PlayerSearchInput, PlayerSearchOutput,
  PlayerInfoInput, PlayerInfoOutput,
  PlayerProjectionInput, PlayerProjectionOutput,
  PlayerPerformanceInput, PlayerPerformanceOutput,
  PlayerRankingInput, PlayerRankingOutput,
  PlayerInjuryInput, PlayerInjuryOutput,
  PlayerNewsInput, PlayerNewsOutput,
  PlayerProfileInput, PlayerProfileOutput,
  StartSitInput, StartSitOutput,
  WaiverAnalysisInput, WaiverAnalysisOutput,
  TradeAnalysisInput, TradeAnalysisOutput,
  TradeBuilderInput, TradeBuilderOutput,
  SleeperAnalysisInput, SleeperAnalysisOutput,
  MatchupAnalysisInput, MatchupAnalysisOutput,
  RosterAnalysisInput, RosterAnalysisOutput,
  ToolResult, ToolDefinition,
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
  description: 'Get detailed player info by Sleeper player ID.',
  async execute(input: PlayerInfoInput): Promise<ToolResult<PlayerInfoOutput>> {
    try {
      const player = await getPlayerById(input.playerId);
      if (!player) return errorResult(`Player not found: ${input.playerId}`);
      const projection = await getPlayerProjection(input.playerId);
      return okResult({ player, projection });
    } catch (e) {
      return errorResult(`Player info failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    }
  },
};

// ---- REAL (when provider configured): player_projection ----

export const playerProjectionTool: ToolDefinition<PlayerProjectionInput, PlayerProjectionOutput> = {
  name: TOOL_NAMES.PLAYER_PROJECTION,
  description: 'Get a player weekly projection from the fantasy data provider.',
  async execute(input: PlayerProjectionInput): Promise<ToolResult<PlayerProjectionOutput>> {
    try {
      const status = await getFantasyDataStatus();
      if (!status.available) {
        return okResult({ projection: null, available: false }, status.message);
      }
      const season = input.season ?? new Date().getFullYear();
      const week = input.week ?? 1;
      const format = input.scoringFormat ?? 'Half-PPR';
      const projection = await getPlayerWeeklyProjection(input.playerId, season, week, format);
      return okResult({ projection, available: true });
    } catch (e) {
      return errorResult(`Projection fetch failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    }
  },
};

// ---- REAL (when provider configured): player_recent_performance ----

export const playerPerformanceTool: ToolDefinition<PlayerPerformanceInput, PlayerPerformanceOutput> = {
  name: TOOL_NAMES.PLAYER_PERFORMANCE,
  description: 'Get recent actual fantasy performance for a player.',
  async execute(input: PlayerPerformanceInput): Promise<ToolResult<PlayerPerformanceOutput>> {
    try {
      const status = await getFantasyDataStatus();
      if (!status.available) {
        return okResult({ performances: [], available: false }, status.message);
      }
      const season = input.season ?? new Date().getFullYear();
      const weeks = input.numberOfWeeks ?? 3;
      const format = input.scoringFormat ?? 'Half-PPR';
      const performances = await getRecentFantasyPerformance(input.playerId, season, weeks, format);
      return okResult({ performances, available: true });
    } catch (e) {
      return errorResult(`Performance fetch failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    }
  },
};

// ---- REAL (when provider configured): player_rankings ----

export const playerRankingTool: ToolDefinition<PlayerRankingInput, PlayerRankingOutput> = {
  name: TOOL_NAMES.PLAYER_RANKINGS,
  description: 'Get expert consensus ranking for a player.',
  async execute(input: PlayerRankingInput): Promise<ToolResult<PlayerRankingOutput>> {
    try {
      const status = await getFantasyDataStatus();
      if (!status.available) {
        return okResult({ ranking: null, available: false }, status.message);
      }
      const week = input.week ?? 1;
      const format = input.scoringFormat ?? 'Half-PPR';
      const ranking = await getPlayerRanking(input.playerId, week, format);
      return okResult({ ranking, available: true });
    } catch (e) {
      return errorResult(`Ranking fetch failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    }
  },
};

// ---- REAL (when provider configured): player_injury ----

export const playerInjuryTool: ToolDefinition<PlayerInjuryInput, PlayerInjuryOutput> = {
  name: TOOL_NAMES.PLAYER_INJURY,
  description: 'Get current injury status for a player.',
  async execute(input: PlayerInjuryInput): Promise<ToolResult<PlayerInjuryOutput>> {
    try {
      const status = await getFantasyDataStatus();
      if (!status.available) {
        return okResult({ injury: null, available: false }, status.message);
      }
      const injury = await getPlayerInjury(input.playerId);
      return okResult({ injury, available: true });
    } catch (e) {
      return errorResult(`Injury fetch failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    }
  },
};

// ---- REAL (when provider configured): player_news ----

export const playerNewsTool: ToolDefinition<PlayerNewsInput, PlayerNewsOutput> = {
  name: TOOL_NAMES.PLAYER_NEWS,
  description: 'Get recent news for a player.',
  async execute(input: PlayerNewsInput): Promise<ToolResult<PlayerNewsOutput>> {
    try {
      const status = await getFantasyDataStatus();
      if (!status.available) {
        return okResult({ news: [], available: false }, status.message);
      }
      const news = await getPlayerNews(input.playerId);
      return okResult({ news, available: true });
    } catch (e) {
      return errorResult(`News fetch failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    }
  },
};

// ---- REAL (when provider configured): player_profile ----

export const playerProfileTool: ToolDefinition<PlayerProfileInput, PlayerProfileOutput> = {
  name: TOOL_NAMES.PLAYER_PROFILE,
  description: 'Get aggregated fantasy profile: identity + projection + performance + ranking + injury + news.',
  async execute(input: PlayerProfileInput): Promise<ToolResult<PlayerProfileOutput>> {
    try {
      const profile = await getPlayerFantasyProfile(input.playerId, {
        season: input.season,
        week: input.week,
        scoringFormat: input.scoringFormat,
      });
      if (!profile) return errorResult(`Player not found: ${input.playerId}`);
      return okResult({ profile });
    } catch (e) {
      return errorResult(`Profile fetch failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    }
  },
};

// ---- DATA GATHERED, REASONING NOT CONNECTED: start_sit_analysis ----

export const startSitTool: ToolDefinition<StartSitInput, StartSitOutput> = {
  name: TOOL_NAMES.START_SIT,
  description: 'Analyze a roster for start/sit decisions. Gathers real data context; AI reasoning not connected.',
  async execute(input: StartSitInput): Promise<ToolResult<StartSitOutput>> {
    try {
      // Gather real data for the roster players
      const [projections, injuries] = await Promise.all([
        Promise.all(input.rosterPlayerIds.map((id) =>
          getPlayerWeeklyProjection(id, new Date().getFullYear(), input.week ?? 1, input.scoring.format)
        )),
        getCurrentInjuries(),
      ]);

      const rosterInjuries = injuries.filter((i) => input.rosterPlayerIds.includes(i.playerId));
      const validProjections = projections.filter((p): p is NonNullable<typeof p> => p !== null);

      // Get player identities
      const players = await Promise.all(input.rosterPlayerIds.map((id) => getPlayerById(id)));
      const validPlayers = players.filter((p): p is NonNullable<typeof p> => p !== null);

      return {
        status: 'not-connected',
        message: 'Start/sit reasoning engine not connected. Real projection, injury, and ranking data has been gathered for the AI model to analyze.',
        data: {
          starters: validPlayers.slice(0, input.scoring.qbSlots + input.scoring.rbSlots + input.scoring.wrSlots + input.scoring.teSlots + input.scoring.flexSlots),
          bench: validPlayers.slice(input.scoring.qbSlots + input.scoring.rbSlots + input.scoring.wrSlots + input.scoring.teSlots + input.scoring.flexSlots),
          projections: validProjections,
          injuries: rosterInjuries,
          rankings: [],
          reasoning: 'Data context ready. AI reasoning engine not connected.',
        },
      };
    } catch (e) {
      return errorResult(`Start/sit data gathering failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    }
  },
};

// ---- NOT CONNECTED: waiver_analysis ----

export const waiverTool: ToolDefinition<WaiverAnalysisInput, WaiverAnalysisOutput> = {
  name: TOOL_NAMES.WAIVER,
  description: 'Analyze waiver wire for sleeper and free agent targets.',
  async execute(): Promise<ToolResult<WaiverAnalysisOutput>> {
    return notConnected(TOOL_NAMES.WAIVER, 'Waiver analysis requires the AI reasoning engine. Player data is available for the AI to analyze.');
  },
};

// ---- NOT CONNECTED: trade_analysis ----

export const tradeAnalysisTool: ToolDefinition<TradeAnalysisInput, TradeAnalysisOutput> = {
  name: TOOL_NAMES.TRADE_ANALYSIS,
  description: 'Analyze a trade proposal for fairness and expected value.',
  async execute(): Promise<ToolResult<TradeAnalysisOutput>> {
    return notConnected(TOOL_NAMES.TRADE_ANALYSIS, 'Trade analysis requires the AI reasoning engine. Player projections and rankings are available for the AI to analyze.');
  },
};

// ---- NOT CONNECTED: trade_builder ----

export const tradeBuilderTool: ToolDefinition<TradeBuilderInput, TradeBuilderOutput> = {
  name: TOOL_NAMES.TRADE_BUILDER,
  description: 'Generate trade proposals that improve the user roster.',
  async execute(): Promise<ToolResult<TradeBuilderOutput>> {
    return notConnected(TOOL_NAMES.TRADE_BUILDER, 'Trade builder requires the AI reasoning engine.');
  },
};

// ---- NOT CONNECTED: sleeper_analysis ----

export const sleeperTool: ToolDefinition<SleeperAnalysisInput, SleeperAnalysisOutput> = {
  name: TOOL_NAMES.SLEEPER,
  description: 'Find sleeper candidates with AI upside projections.',
  async execute(): Promise<ToolResult<SleeperAnalysisOutput>> {
    return notConnected(TOOL_NAMES.SLEEPER, 'Sleeper analysis requires the AI reasoning engine. Player projections and rankings are available for the AI to analyze.');
  },
};

// ---- NOT CONNECTED: matchup_analysis ----

export const matchupTool: ToolDefinition<MatchupAnalysisInput, MatchupAnalysisOutput> = {
  name: TOOL_NAMES.MATCHUP,
  description: 'Analyze a weekly matchup with win probability and lineup moves.',
  async execute(): Promise<ToolResult<MatchupAnalysisOutput>> {
    return notConnected(TOOL_NAMES.MATCHUP, 'Matchup analysis requires the AI reasoning engine. Projection data is available for the AI to analyze.');
  },
};

// ---- NOT CONNECTED: roster_analysis ----

export const rosterTool: ToolDefinition<RosterAnalysisInput, RosterAnalysisOutput> = {
  name: TOOL_NAMES.ROSTER,
  description: 'Analyze a roster for strengths, weaknesses, and recommendations.',
  async execute(): Promise<ToolResult<RosterAnalysisOutput>> {
    return notConnected(TOOL_NAMES.ROSTER, 'Roster analysis requires the AI reasoning engine. Player projections are available for the AI to analyze.');
  },
};

// ---- Tool registry ----

export const allTools = [
  playerSearchTool,
  playerInfoTool,
  playerProjectionTool,
  playerPerformanceTool,
  playerRankingTool,
  playerInjuryTool,
  playerNewsTool,
  playerProfileTool,
  startSitTool,
  waiverTool,
  tradeAnalysisTool,
  tradeBuilderTool,
  sleeperTool,
  matchupTool,
  rosterTool,
];
