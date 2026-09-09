// Maps raw FantasyPros API responses into the app's shared fantasy data types.
// All validation and normalization happens here.
//
// Based on the actual FantasyPros API v2 response format:
// https://api.fantasypros.com/public/v2/docs

import type {
  PlayerStats,
  PlayerWeeklyProjection,
  PlayerFantasyPerformance,
  PlayerRanking,
  PlayerInjury,
  PlayerNews,
  ScoringFormat,
  FantasyPosition,
  NFLTeam,
  PlayerExternalIds,
} from '@/types';

// ---- Raw FantasyPros response shapes (actual API field names) ----

export interface RawFPPlayer {
  player_id: number | string;
  player_name: string;
  short_name?: string;
  first_name?: string;
  last_name?: string;
  position_id?: string;
  positions?: string[];
  team_id?: string;
  sportsdata_player_id?: string;
  player_yahoo_id?: number | string;
  cbs_player_id?: number | string;
  player_bye_week?: number | string;
  rank_ecr?: number;
  rank_adp?: number;
  rank_ecr_ppr?: number;
  rank_ecr_half?: number;
  [key: string]: unknown;
}

export interface RawFPRankingPlayer {
  player_id: number | string;
  player_name: string;
  player_team_id?: string;
  player_position_id?: string;
  player_positions?: string;
  player_short_name?: string;
  player_yahoo_id?: number | string;
  rank_ecr?: number;
  rank_min?: string | number;
  rank_max?: string | number;
  rank_ave?: string | number;
  rank_std?: string | number;
  pos_rank?: string;
  tier?: number;
  player_owned_avg?: number;
  [key: string]: unknown;
}

// Projections endpoint uses a different shape: fpid, name, stats sub-object
export interface RawFPProjectionPlayer {
  fpid: number | string;
  mflid?: number | string;
  name: string;
  position_id?: string;
  team_id?: string;
  filename?: string;
  stats?: {
    points?: number | string;
    points_ppr?: number | string;
    points_half?: number | string;
    pass_att?: number | string;
    pass_cmp?: number | string;
    pass_yds?: number | string;
    pass_tds?: number | string;
    pass_ints?: number | string;
    rush_att?: number | string;
    rush_yds?: number | string;
    rush_tds?: number | string;
    rec_tgt?: number | string;
    rec?: number | string;
    rec_yds?: number | string;
    rec_tds?: number | string;
    fumbles?: number | string;
    fg_made?: number | string;
    fg_att?: number | string;
    xp_made?: number | string;
    xp_att?: number | string;
    def_sack?: number | string;
    def_int?: number | string;
    def_td?: number | string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Player-points endpoint uses the same shape as projections

export interface RawFPInjury {
  player_id: number | string;
  yahoo_id?: number | string;
  name: string;
  team_id?: string;
  position_id?: string;
  status: string;
  status_short?: string;
  injury_type?: string;
  comment?: string;
  injury_update_date?: string;
  rank?: number;
  probability_of_playing?: string;
  practice_1?: string | null;
  practice_2?: string | null;
  practice_3?: string | null;
  practice_report_injury_type?: string;
  ir_weeks?: unknown[];
  [key: string]: unknown;
}

export interface RawFPNewsItem {
  player_id?: number | string;
  player_name?: string;
  name?: string;
  title?: string;
  content?: string;
  date?: string;
  source?: string;
  news_id?: number | string;
  [key: string]: unknown;
}

// ---- Helpers ----

function num(val: number | string | undefined): number {
  if (val === undefined || val === null || val === '') return 0;
  const n = typeof val === 'string' ? parseFloat(val) : val;
  return isNaN(n) ? 0 : n;
}

function str(val: unknown): string | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  return String(val);
}

// ---- Mappers ----

export function mapProjection(
  raw: RawFPProjectionPlayer,
  playerId: string,
  season: number,
  week: number,
  scoringFormat: ScoringFormat,
  provider = 'FantasyPros',
): PlayerWeeklyProjection {
  const s = raw.stats ?? {};
  const stats: PlayerStats = {
    playerId,
    passingYards: num(s.pass_yds),
    passingTDs: num(s.pass_tds),
    interceptions: num(s.pass_ints),
    passingAttempts: num(s.pass_att),
    completions: num(s.pass_cmp),
    rushingAttempts: num(s.rush_att),
    rushingYards: num(s.rush_yds),
    rushingTDs: num(s.rush_tds),
    targets: num(s.rec_tgt),
    receptions: num(s.rec),
    receivingYards: num(s.rec_yds),
    receivingTDs: num(s.rec_tds),
    fumbles: num(s.fumbles),
    fieldGoalsMade: num(s.fg_made),
    fieldGoalsAttempted: num(s.fg_att),
    extraPointsMade: num(s.xp_made),
    extraPointsAttempted: num(s.xp_att),
    defensiveSacks: num(s.def_sack),
    defensiveInterceptions: num(s.def_int),
    defensiveTDs: num(s.def_td),
  };

  // Use the scoring-format-specific points if available
  const projectedPoints = scoringFormat === 'Full-PPR' || scoringFormat === 'PPR'
    ? num(s.points_ppr ?? s.points)
    : scoringFormat === 'Half-PPR'
    ? num(s.points_half ?? s.points)
    : num(s.points);

  return {
    playerId,
    providerPlayerId: str(raw.fpid),
    season,
    week,
    projectedFantasyPoints: projectedPoints,
    stats,
    provider,
    scoringFormat,
    updatedAt: Date.now(),
  };
}

export function mapPerformance(
  raw: RawFPProjectionPlayer,
  playerId: string,
  season: number,
  week: number,
  scoringFormat: ScoringFormat,
): PlayerFantasyPerformance {
  const s = raw.stats ?? {};
  return {
    playerId,
    season,
    week,
    fantasyPoints: num(s.points),
    stats: {
      playerId,
      passingYards: num(s.pass_yds),
      passingTDs: num(s.pass_tds),
      interceptions: num(s.pass_ints),
      rushingAttempts: num(s.rush_att),
      rushingYards: num(s.rush_yds),
      rushingTDs: num(s.rush_tds),
      targets: num(s.rec_tgt),
      receptions: num(s.rec),
      receivingYards: num(s.rec_yds),
      receivingTDs: num(s.rec_tds),
      fumbles: num(s.fumbles),
      fieldGoalsMade: num(s.fg_made),
      extraPointsMade: num(s.xp_made),
    },
    scoringFormat,
    updatedAt: Date.now(),
  };
}

export function mapRanking(
  raw: RawFPRankingPlayer,
  playerId: string,
  scoringFormat: ScoringFormat,
  week: number,
): PlayerRanking | null {
  const pos = normalizePosition(raw.player_position_id);
  if (!pos) return null;

  const positionalRank = parsePosRank(raw.pos_rank);

  return {
    playerId,
    position: pos,
    overallRank: raw.rank_ecr ? num(raw.rank_ecr) : undefined,
    positionalRank: positionalRank > 0 ? positionalRank : num(raw.rank_ecr),
    tier: raw.tier ? num(raw.tier) : undefined,
    scoringFormat,
    week,
    source: 'FantasyPros',
    updatedAt: Date.now(),
  };
}

export function mapInjury(
  raw: RawFPInjury,
  playerId: string,
): PlayerInjury {
  // Build practice status from the three practice fields
  const practices = [raw.practice_1, raw.practice_2, raw.practice_3]
    .filter((p): p is string => p !== null && p !== undefined);
  const practiceStatus = practices.length > 0 ? practices.join(', ') : undefined;

  return {
    playerId,
    status: str(raw.status) ?? 'Unknown',
    bodyPart: str(raw.injury_type),
    practiceStatus,
    description: str(raw.comment) || str(raw.probability_of_playing),
    updatedAt: raw.injury_update_date ? new Date(raw.injury_update_date).getTime() : Date.now(),
  };
}

export function mapNews(
  raw: RawFPNewsItem,
  playerId: string,
): PlayerNews {
  return {
    playerId,
    headline: str(raw.title) ?? '',
    summary: str(raw.content) ?? '',
    publishedAt: raw.date ? new Date(raw.date).getTime() : Date.now(),
    source: str(raw.source) ?? 'FantasyPros',
  };
}

export function mapPlayerExternalIds(raw: RawFPPlayer): Partial<PlayerExternalIds> {
  const ids: Partial<PlayerExternalIds> = {};
  if (raw.player_yahoo_id) ids.yahoo = String(raw.player_yahoo_id);
  if (raw.player_id) ids.fantasyPros = String(raw.player_id);
  return ids;
}

// ---- Position / team validation ----

const VALID_POSITIONS: ReadonlySet<string> = new Set(['QB', 'RB', 'WR', 'TE', 'K', 'DEF', 'DST', 'D/ST', 'PK']);

export function normalizePosition(pos: string | undefined): FantasyPosition | null {
  if (!pos) return null;
  const upper = pos.toUpperCase().trim();
  if (!VALID_POSITIONS.has(upper)) return null;
  if (upper === 'DEF' || upper === 'DST') return 'D/ST';
  if (upper === 'PK') return 'K';
  return upper as FantasyPosition;
}

const VALID_NFL_TEAMS: ReadonlySet<string> = new Set([
  'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE',
  'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC',
  'LV', 'LAC', 'LAR', 'MIA', 'MIN', 'NE', 'NO', 'NYG',
  'NYJ', 'PHI', 'PIT', 'SF', 'SEA', 'TB', 'TEN', 'WAS',
]);

export function normalizeTeam(team: string | undefined): NFLTeam | null {
  if (!team) return null;
  const upper = team.toUpperCase().trim();
  if (!VALID_NFL_TEAMS.has(upper)) return null;
  return upper as NFLTeam;
}

// ---- Helpers ----

function parsePosRank(posRank: string | undefined): number {
  if (!posRank) return 0;
  const match = posRank.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}
