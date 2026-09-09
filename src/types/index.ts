// Shared domain types for the Fantasy Football AI app.
// Every component imports player / team / projection shapes from here
// so we never duplicate slightly-different versions of the same object.

export type NFLTeam =
  | 'ARI' | 'ATL' | 'BAL' | 'BUF' | 'CAR' | 'CHI' | 'CIN' | 'CLE'
  | 'DAL' | 'DEN' | 'DET' | 'GB' | 'HOU' | 'IND' | 'JAX' | 'KC'
  | 'LV' | 'LAC' | 'LAR' | 'MIA' | 'MIN' | 'NE' | 'NO' | 'NYG'
  | 'NYJ' | 'PHI' | 'PIT' | 'SF' | 'SEA' | 'TB' | 'TEN' | 'WAS';

export type FantasyPosition =
  | 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF' | 'D/ST' | 'FLEX' | 'Bench';

export type PlayerStatus =
  | 'Strong Start'
  | 'Start'
  | 'Consider Alternatives'
  | 'Bench'
  | 'Trade Candidate'
  | 'Sleeper'
  | 'Questionable'
  | 'Out';

export type RosterSlot =
  | 'QB' | 'RB1' | 'RB2' | 'WR1' | 'WR2' | 'TE'
  | 'FLEX' | 'D/ST' | 'K' | 'BENCH';

// Slot types the manual roster builder can assign.
export type ManualRosterSlot =
  | 'QB' | 'RB' | 'WR' | 'TE' | 'FLEX' | 'K' | 'D/ST' | 'BENCH';

export interface Player {
  id: string;
  name: string;
  position: FantasyPosition;
  nflTeam: NFLTeam;
  opponent?: string;
  status?: PlayerStatus;
  injuryTag?: string;
}

export interface PlayerProjection {
  playerId: string;
  projectedPoints: number;
  ceiling: number;
  floor: number;
  // 0-1 confidence the projection is within range
  confidence: number;
}

export interface RosterPlayer extends Player {
  slot: RosterSlot;
  projection: PlayerProjection;
  recommendation?: string;
}

export interface PlayerRecommendation {
  player: Player;
  projection: PlayerProjection;
  status: PlayerStatus;
  reason: string;
}

export type ScoringFormat =
  | 'Standard'
  | 'Half-PPR'
  | 'Full-PPR'
  | 'PPR';

export interface LeagueScoringSettings {
  format: ScoringFormat;
  passingTdPoints: number;
  passingYardsPerPoint: number;
  passingYardsBonusThreshold?: number;
  interceptionPoints: number;
  rushingTdPoints: number;
  rushingYardsPerPoint: number;
  rushingYardsBonusThreshold?: number;
  receivingYardsPerPoint: number;
  receivingTdPoints: number;
  receptionPoints: number;
  fumblePoints: number;
  teams: number;
  // Roster slot configuration
  qbSlots: number;
  rbSlots: number;
  wrSlots: number;
  teSlots: number;
  flexSlots: number;
  benchSlots: number;
  kickerEnabled: boolean;
  defenseEnabled: boolean;
}

export interface FantasyRoster {
  teamId: string;
  players: RosterPlayer[];
}

export interface FantasyTeam {
  id: string;
  name: string;
  managerName: string;
  leagueId: string;
  record: { wins: number; losses: number; ties: number };
  projectedScore: number;
  roster: FantasyRoster;
}

export interface FantasyLeague {
  id: string;
  name: string;
  scoring: LeagueScoringSettings;
  teams: FantasyTeam[];
  currentWeek: number;
}

export interface WeeklyMatchup {
  week: number;
  userTeamId: string;
  userTeamName: string;
  userProjected: number;
  opponentTeamId: string;
  opponentTeamName: string;
  opponentProjected: number;
  winProbability: number; // 0-1 for the user
  bestLineupMove?: string;
  expectedImprovement?: number;
  riskyMove?: string;
  observations: string[];
}

// ---- Trade ----

export type TradeRecommendationType =
  | 'Fair Trade'
  | 'Slightly Favor You'
  | 'Strongly Favor You'
  | 'Overpay'
  | 'Unfair To Opponent';

export interface TradeSide {
  players: Player[];
  totalProjected: number;
  totalCeiling: number;
}

export interface TradeProposal {
  id: string;
  youGive: TradeSide;
  youReceive: TradeSide;
}

export interface TradeAnalysis {
  proposal: TradeProposal;
  fairnessScore: number; // 0-100
  expectedWeeklyImprovement: number; // points for user
  opponentExpectedValue: number; // points for opponent
  likelihoodAccepted: number; // 0-1
  recommendation: TradeRecommendationType;
  explanation: string;
}

// ---- Sleeper ----

export type SleeperRecommendationType =
  | 'Free Agent Target'
  | 'Trade Target'
  | 'Deep Sleeper'
  | 'Buy Low'
  | 'Sell High';

export interface SleeperRecommendation {
  player: Player;
  normalProjection: number;
  aiUpside: number;
  confidence: number; // 0-1
  reasoning: string;
  recommendationType: SleeperRecommendationType;
}

// ---- Roster screenshot analysis ----

export interface UploadedRosterAnalysis {
  imageUrl: string;
  teamName: string;
  projectedTeamScore: number;
  projectedCeiling: number;
  biggestStrength: string;
  biggestWeakness: string;
  roster: RosterPlayer[];
  observations: string[];
}

// ---- Chat ----

export type ChatMessageKind =
  | 'user'
  | 'assistant'
  | 'roster-analysis'
  | 'player-recommendation'
  | 'sleeper-recommendation'
  | 'trade-analysis'
  | 'matchup-analysis'
  | 'team-overview'
  | 'lineup-suggestion';

export interface ChatAttachment {
  id: string;
  name: string;
  dataUrl: string;
  kind: 'image';
}

export interface ChatMessage {
  id: string;
  kind: ChatMessageKind;
  text?: string;
  attachments?: ChatAttachment[];
  // Strongly-typed payloads for structured card messages.
  rosterAnalysis?: UploadedRosterAnalysis;
  playerRecommendations?: PlayerRecommendation[];
  sleeper?: SleeperRecommendation;
  sleepers?: SleeperRecommendation[];
  tradeAnalysis?: TradeAnalysis;
  matchup?: WeeklyMatchup;
  teamOverview?: FantasyTeam;
  lineupSuggestion?: {
    starters: RosterPlayer[];
    bench: RosterPlayer[];
    expectedTotal: number;
    notes: string;
  };
  createdAt: number;
  pending?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

// ---- Manual roster / team ----

export interface ManualRosterEntry {
  id: string; // unique entry id
  playerId: string; // Sleeper player ID
  slot: ManualRosterSlot;
}

export interface ManualTeam {
  id: string;
  name: string;
  leagueId: string;
  roster: ManualRosterEntry[];
  createdAt: number;
  updatedAt: number;
}

export interface ManualLeague {
  id: string;
  name: string;
  scoring: LeagueScoringSettings;
  createdAt: number;
  updatedAt: number;
}

// ---- Uploaded image ----

export type UploadAnalysisStatus = 'pending' | 'analyzing' | 'done' | 'error';

export interface UploadedImage {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  previewUrl: string;
  createdAt: number;
  analysisStatus: UploadAnalysisStatus;
}

// ---- Player external IDs / crosswalk ----

export interface PlayerExternalIds {
  sleeper?: string;
  fantasyPros?: string;
  yahoo?: string;
  espn?: string;
}

// ---- Fantasy data types (provider-neutral) ----

/** Raw statistical line for a player in a given week. */
export interface PlayerStats {
  playerId: string;
  passingYards?: number;
  passingTDs?: number;
  interceptions?: number;
  passingAttempts?: number;
  completions?: number;
  rushingAttempts?: number;
  rushingYards?: number;
  rushingTDs?: number;
  targets?: number;
  receptions?: number;
  receivingYards?: number;
  receivingTDs?: number;
  fumbles?: number;
  fieldGoalsMade?: number;
  fieldGoalsAttempted?: number;
  extraPointsMade?: number;
  extraPointsAttempted?: number;
  defensiveSacks?: number;
  defensiveInterceptions?: number;
  defensiveFumblesRecovered?: number;
  defensiveTDs?: number;
  pointsAllowed?: number;
  yardsAllowed?: number;
}

/** Weekly projection for a player from a fantasy data provider. */
export interface PlayerWeeklyProjection {
  playerId: string;
  providerPlayerId?: string;
  season: number;
  week: number;
  projectedFantasyPoints: number;
  stats: PlayerStats;
  provider: string;
  scoringFormat: ScoringFormat;
  updatedAt: number;
}

/** Actual fantasy performance for a player in a completed week. */
export interface PlayerFantasyPerformance {
  playerId: string;
  season: number;
  week: number;
  fantasyPoints: number;
  stats: PlayerStats;
  scoringFormat: ScoringFormat;
  updatedAt: number;
}

/** Expert consensus ranking for a player. */
export interface PlayerRanking {
  playerId: string;
  position: FantasyPosition;
  overallRank?: number;
  positionalRank: number;
  tier?: number;
  scoringFormat: ScoringFormat;
  week: number;
  source: string;
  updatedAt: number;
}

/** Player injury information. */
export interface PlayerInjury {
  playerId: string;
  status: string;
  bodyPart?: string;
  practiceStatus?: string;
  description?: string;
  updatedAt: number;
}

/** Player news item. */
export interface PlayerNews {
  playerId: string;
  headline: string;
  summary: string;
  publishedAt: number;
  source: string;
}

/** Aggregated fantasy profile combining all available data. */
export interface FantasyPlayerProfile {
  player: Player;
  externalIds: PlayerExternalIds;
  weeklyProjection?: PlayerWeeklyProjection;
  recentPerformance?: PlayerFantasyPerformance[];
  ranking?: PlayerRanking;
  injury?: PlayerInjury;
  news?: PlayerNews[];
  // Flags indicating which sources are available vs unavailable
  sources: {
    sleeper: boolean;
    fantasyPros: boolean;
  };
}

/** Provider availability / connection status. */
export interface FantasyDataStatus {
  available: boolean;
  provider: string;
  message: string;
}

// ---- Yahoo OAuth / provider-neutral league types ----

export type YahooConnectionStatus =
  | 'not_configured'
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'expired'
  | 'error';

export interface YahooConnection {
  connected: boolean;
  status: YahooConnectionStatus;
  leagueName?: string;
  format?: ScoringFormat;
  rosterCount?: number;
  yahooGuid?: string;
  error?: string;
}

export interface ProviderLeague {
  providerLeagueId: string;
  provider: 'yahoo' | 'espn' | 'sleeper';
  name: string;
  season: number;
  numberOfTeams: number;
  currentWeek?: number;
  scoringType?: string;
  isKeeperLeague?: boolean;
  draftStatus?: string;
}

export interface ProviderTeam {
  providerTeamId: string;
  providerLeagueId: string;
  name: string;
  managerName: string;
  managerIsUser: boolean;
  record: { wins: number; losses: number; ties: number };
  projectedScore?: number;
  roster?: ProviderRosterEntry[];
}

export interface ProviderRosterEntry {
  providerPlayerId: string;
  yahooPlayerKey?: string;
  playerName: string;
  position: FantasyPosition;
  nflTeam: NFLTeam;
  slot: string;
  eligiblePositions?: string[];
  byeWeek?: number;
  injuryStatus?: string;
  isStarter: boolean;
}

export interface ProviderMatchup {
  week: number;
  userTeamId: string;
  userTeamName: string;
  userProjected: number;
  userActual?: number;
  opponentTeamId: string;
  opponentTeamName: string;
  opponentProjected: number;
  opponentActual?: number;
  matchupState?: string;
}

export interface YahooScoringCategory {
  yahooKey: string;
  yahooLabel: string;
  value: number;
  unit?: string;
  supported: boolean;
}

export interface YahooLeagueSettings {
  scoring: LeagueScoringSettings;
  rawYahooScoring: YahooScoringCategory[];
  unsupportedCategories: YahooScoringCategory[];
}

export interface CrosswalkDiagnostic {
  totalProviderPlayers: number;
  directlyMatched: number;
  matchedByName: number;
  unmatched: number;
  ambiguous: number;
  unmatchedPlayers: string[];
}

// ---- Auth ----

export interface MockUser {
  id: string;
  email: string;
  displayName: string;
}
