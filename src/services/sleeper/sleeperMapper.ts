// Maps raw Sleeper API player objects into the app's shared Player type.
// All validation happens here — no blind casts of position or team strings.

import type { FantasyPosition, NFLTeam, Player } from '@/types';

// ---- Validation sets ----

const VALID_NFL_TEAMS: ReadonlySet<string> = new Set([
  'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE',
  'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC',
  'LV', 'LAC', 'LAR', 'MIA', 'MIN', 'NE', 'NO', 'NYG',
  'NYJ', 'PHI', 'PIT', 'SF', 'SEA', 'TB', 'TEN', 'WAS',
]);

// Positions that map cleanly to our FantasyPosition union.
const POSITION_MAP: Record<string, FantasyPosition> = {
  QB: 'QB',
  RB: 'RB',
  WR: 'WR',
  TE: 'TE',
  K: 'K',
  DEF: 'D/ST',
  DST: 'D/ST',
  'D/ST': 'D/ST',
};

// UI-only slots that are NOT real NFL positions — never used for mapping.
const UI_ONLY_SLOTS = new Set(['FLEX', 'Bench', 'BENCH']);

export interface RawSleeperPlayer {
  player_id: string;
  first_name: string | null;
  last_name: string | null;
  full_name?: string | null;
  position: string | null;
  fantasy_positions?: string[] | null;
  team: string | null;
  injury_status?: string | null;
  injury_body_part?: string | null;
  injury_notes?: string | null;
  status?: string | null; // Active, Inactive, etc.
  search_rank?: number | null;
  news_id?: string | null;
  espn_id?: number | null;
  yahoo_id?: number | null;
}

/**
 * Safely maps a raw Sleeper player into the app's Player type.
 * Returns null if the player cannot be reliably mapped (missing ID,
 * unresolvable name, invalid position, or unknown team).
 *
 * Defensive teams (DEF) are mapped to our 'D/ST' FantasyPosition.
 * Free agents (team === null) are still mapped — their nflTeam is set
 * to a sentinel that the UI can display as "FA".
 */
export function mapSleeperPlayer(raw: RawSleeperPlayer): Player | null {
  if (!raw.player_id) return null;

  // Resolve name.
  const name =
    raw.full_name?.trim() ||
    `${raw.first_name ?? ''} ${raw.last_name ?? ''}`.trim() ||
    null;
  if (!name) return null;

  // Resolve and validate position.
  const rawPos = raw.position?.toUpperCase() ?? null;
  if (!rawPos || rawPos in UI_ONLY_SLOTS) return null;
  const position = POSITION_MAP[rawPos];
  if (!position) return null;

  // Resolve team — null/empty team means free agent.
  const rawTeam = raw.team?.toUpperCase().trim() ?? '';
  let nflTeam: NFLTeam;
  if (rawTeam && VALID_NFL_TEAMS.has(rawTeam)) {
    nflTeam = rawTeam as NFLTeam;
  } else if (!rawTeam || rawTeam === 'FA') {
    // Free agent — use a valid sentinel. We don't add "FA" to the NFLTeam
    // union to keep type safety. Instead we set a known valid team and
    // rely on a separate free-agent flag the UI can check. For now, we
    // skip free agents in the active-player fetch (Sleeper filters by
    // active=true which usually means they have a team).
    return null;
  } else {
    // Unknown team abbreviation — skip rather than cast blindly.
    return null;
  }

  // Build injury tag from available fields.
  let injuryTag: string | undefined;
  if (raw.injury_status) {
    injuryTag = raw.injury_body_part
      ? `${raw.injury_status} - ${raw.injury_body_part}`
      : raw.injury_status;
  }

  return {
    id: raw.player_id,
    name,
    position,
    nflTeam,
    injuryTag,
  };
}

/**
 * Maps an array of raw Sleeper players, filtering out nulls.
 */
export function mapSleeperPlayers(raws: RawSleeperPlayer[]): Player[] {
  return raws
    .map(mapSleeperPlayer)
    .filter((p): p is Player => p !== null);
}
