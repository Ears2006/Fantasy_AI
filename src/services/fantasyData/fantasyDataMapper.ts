// Maps raw FantasyPros API responses into the app's shared fantasy data types.
// All validation and normalization happens here.

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
} from '@/types';

// ---- Raw FantasyPros response shapes (subset of fields we use) ----

export interface RawFPProjection {
  player_id?: string;
  name?: string;
  team?: string;
  position?: string;
  proj_pts?: number | string;
  pass_yd?: number | string;
  pass_td?: number | string;
  pass_int?: number | string;
  pass_att?: number | string;
  cmp?: number | string;
  rush_att?: number | string;
  rush_yd?: number | string;
  rush_td?: number | string;
  rec_tgt?: number | string;
  rec?: number | string;
  rec_yd?: number | string;
  rec_td?: number | string;
  fum?: number | string;
  fg_made?: number | string;
  fg_att?: number | string;
  xp_made?: number | string;
  xp_att?: number | string;
  [key: string]: unknown;
}

export interface RawFPRanking {
  player_id?: string;
  name?: string;
  team?: string;
  position?: string;
  rank?: number | string;
  pos_rank?: number | string;
  tier?: number | string;
  [key: string]: unknown;
}

export interface RawFPInjury {
  player_id?: string;
  name?: string;
  team?: string;
  position?: string;
  status?: string;
  injury?: string;
  practice_status?: string;
  notes?: string;
  updated?: string;
  [key: string]: unknown;
}

export interface RawFPNews {
  player_id?: string;
  name?: string;
  title?: string;
  content?: string;
  date?: string;
  source?: string;
  [key: string]: unknown;
}

export interface RawFPPlayer {
  player_id?: string;
  name?: string;
  team?: string;
  position?: string;
  espn_id?: number | string | null;
  yahoo_id?: number | string | null;
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
  raw: RawFPProjection,
  playerId: string,
  season: number,
  week: number,
  scoringFormat: ScoringFormat,
  provider = 'FantasyPros',
): PlayerWeeklyProjection {
  const stats: PlayerStats = {
    playerId,
    passingYards: num(raw.pass_yd),
    passingTDs: num(raw.pass_td),
    interceptions: num(raw.pass_int),
    passingAttempts: num(raw.pass_att),
    completions: num(raw.cmp),
    rushingAttempts: num(raw.rush_att),
    rushingYards: num(raw.rush_yd),
    rushingTDs: num(raw.rush_td),
    targets: num(raw.rec_tgt),
    receptions: num(raw.rec),
    receivingYards: num(raw.rec_yd),
    receivingTDs: num(raw.rec_td),
    fumbles: num(raw.fum),
    fieldGoalsMade: num(raw.fg_made),
    fieldGoalsAttempted: num(raw.fg_att),
    extraPointsMade: num(raw.xp_made),
    extraPointsAttempted: num(raw.xp_att),
  };

  return {
    playerId,
    providerPlayerId: str(raw.player_id),
    season,
    week,
    projectedFantasyPoints: num(raw.proj_pts),
    stats,
    provider,
    scoringFormat,
    updatedAt: Date.now(),
  };
}

export function mapPerformance(
  raw: RawFPProjection,
  playerId: string,
  season: number,
  week: number,
  scoringFormat: ScoringFormat,
): PlayerFantasyPerformance {
  return {
    playerId,
    season,
    week,
    fantasyPoints: num(raw.proj_pts),
    stats: {
      playerId,
      passingYards: num(raw.pass_yd),
      passingTDs: num(raw.pass_td),
      interceptions: num(raw.pass_int),
      rushingAttempts: num(raw.rush_att),
      rushingYards: num(raw.rush_yd),
      rushingTDs: num(raw.rush_td),
      targets: num(raw.rec_tgt),
      receptions: num(raw.rec),
      receivingYards: num(raw.rec_yd),
      receivingTDs: num(raw.rec_td),
      fumbles: num(raw.fum),
      fieldGoalsMade: num(raw.fg_made),
      extraPointsMade: num(raw.xp_made),
    },
    scoringFormat,
    updatedAt: Date.now(),
  };
}

export function mapRanking(
  raw: RawFPRanking,
  playerId: string,
  scoringFormat: ScoringFormat,
  week: number,
): PlayerRanking | null {
  const pos = normalizePosition(raw.position);
  if (!pos) return null;
  return {
    playerId,
    position: pos,
    overallRank: raw.rank ? num(raw.rank) : undefined,
    positionalRank: num(raw.pos_rank),
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
  return {
    playerId,
    status: str(raw.status) ?? 'Unknown',
    bodyPart: str(raw.injury),
    practiceStatus: str(raw.practice_status),
    description: str(raw.notes),
    updatedAt: raw.updated ? new Date(raw.updated).getTime() : Date.now(),
  };
}

export function mapNews(
  raw: RawFPNews,
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

// ---- Position / team validation ----

const VALID_POSITIONS: ReadonlySet<string> = new Set(['QB', 'RB', 'WR', 'TE', 'K', 'DEF', 'DST', 'D/ST']);

export function normalizePosition(pos: string | undefined): FantasyPosition | null {
  if (!pos) return null;
  const upper = pos.toUpperCase().trim();
  if (!VALID_POSITIONS.has(upper)) return null;
  if (upper === 'DEF' || upper === 'DST') return 'D/ST';
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
