// Provider-neutral fantasy data service.
// Components and AI tools call these functions — they never call FantasyPros directly.
// Internally, this delegates to the FantasyPros provider client (via edge function).
// If FantasyPros is unavailable, functions return null/empty with clear status.

import type {
  PlayerWeeklyProjection,
  PlayerFantasyPerformance,
  PlayerRanking,
  PlayerInjury,
  PlayerNews,
  FantasyPlayerProfile,
  PlayerExternalIds,
  ScoringFormat,
  LeagueScoringSettings,
  FantasyDataStatus,
} from '@/types';
import { getPlayerById } from '@/services/sleeper/sleeperService';
import { getCached, setCached, clearCache } from './fantasyDataCache';
import {
  checkProviderStatus,
  resetProviderStatus,
  fetchWeeklyProjections,
  fetchPlayerFantasyPoints,
  fetchRankings,
  fetchInjuries,
  fetchPlayerNews,
  fetchAllPlayerMetadata,
  fetchRawRankingPlayers,
} from '@/services/providers/fantasyProsProvider';
import {
  buildPlayerCrosswalk,
  getPlayerExternalIds,
} from './playerCrosswalk';
import { calculateFantasyPoints } from './scoringEngine';

let crosswalkInitialized = false;

const CROSSWALK_POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];

/**
 * Initializes the player crosswalk by fetching FantasyPros player data
 * and matching it against the Sleeper player database.
 *
 * Uses consensus-rankings for all positions to build the crosswalk,
 * since the /players endpoint returns limited sample data on the free tier.
 */
async function ensureCrosswalk(): Promise<void> {
  if (crosswalkInitialized) return;
  try {
    // Try the players endpoint first (may have full data on premium tier)
    let fpPlayers = await fetchAllPlayerMetadata();

    // If players endpoint returned limited data, supplement with rankings
    if (fpPlayers.length < 100) {
      const season = getCurrentSeason();
      for (const pos of CROSSWALK_POSITIONS) {
        try {
          const rawRankingPlayers = await fetchRawRankingPlayers(season, pos);
          // Convert ranking players to the RawFPPlayer shape for the crosswalk
          fpPlayers = fpPlayers.concat(
            rawRankingPlayers.map((r) => ({
              player_id: r.player_id,
              player_name: r.player_name,
              team_id: r.player_team_id,
              position_id: r.player_position_id,
              player_yahoo_id: r.player_yahoo_id,
            })),
          );
        } catch {
          // Continue with other positions
        }
      }
    }

    if (fpPlayers.length > 0) {
      await buildPlayerCrosswalk(fpPlayers);
    }
    crosswalkInitialized = true;
  } catch {
    crosswalkInitialized = true;
  }
}

// ---- Status ----

export async function getFantasyDataStatus(): Promise<FantasyDataStatus> {
  const available = await checkProviderStatus();
  return {
    available,
    provider: 'FantasyPros',
    message: available
      ? 'FantasyPros data is available.'
      : 'FantasyPros API not configured. See docs/INTEGRATION_ROADMAP.md.',
  };
}

// ---- Weekly Projections ----

export async function getWeeklyProjections(
  season: number,
  week: number,
  scoringFormat: ScoringFormat,
  position?: string,
): Promise<PlayerWeeklyProjection[]> {
  const available = await checkProviderStatus();
  if (!available) return [];

  await ensureCrosswalk();

  const cacheKey = `proj:${season}:${week}:${scoringFormat}:${position ?? 'all'}`;
  const cached = getCached<PlayerWeeklyProjection[]>(cacheKey);
  if (cached) return cached;

  try {
    const projections = await fetchWeeklyProjections(season, week, scoringFormat, position);
    setCached(cacheKey, projections);
    return projections;
  } catch {
    return [];
  }
}

export async function getPlayerWeeklyProjection(
  playerId: string,
  season: number,
  week: number,
  scoringFormat: ScoringFormat,
): Promise<PlayerWeeklyProjection | null> {
  const all = await getWeeklyProjections(season, week, scoringFormat);
  return all.find((p) => p.playerId === playerId) ?? null;
}

/**
 * Gets a player's weekly projection and recalculates fantasy points
 * using the user's actual league scoring settings (not just the provider's format).
 */
export async function getPlayerLeagueProjection(
  playerId: string,
  season: number,
  week: number,
  scoring: LeagueScoringSettings,
): Promise<PlayerWeeklyProjection | null> {
  // Fetch the raw projection (use the closest standard format for stats)
  const raw = await getPlayerWeeklyProjection(playerId, season, week, scoring.format);
  if (!raw) return null;

  // Recalculate fantasy points using the user's actual league settings
  const recalculatedPoints = calculateFantasyPoints(raw.stats, scoring);

  return {
    ...raw,
    projectedFantasyPoints: recalculatedPoints,
    scoringFormat: scoring.format,
  };
}

// ---- Actual Performance ----

export async function getPlayerFantasyPoints(
  playerId: string,
  season: number,
  week: number,
  scoringFormat: ScoringFormat,
): Promise<PlayerFantasyPerformance | null> {
  const available = await checkProviderStatus();
  if (!available) return null;

  await ensureCrosswalk();

  const cacheKey = `perf:${season}:${week}:${scoringFormat}`;
  let all = getCached<PlayerFantasyPerformance[]>(cacheKey);
  if (!all) {
    try {
      all = await fetchPlayerFantasyPoints(season, week, scoringFormat);
      setCached(cacheKey, all);
    } catch {
      return null;
    }
  }
  return all.find((p) => p.playerId === playerId) ?? null;
}

export async function getRecentFantasyPerformance(
  playerId: string,
  season: number,
  numberOfWeeks: number,
  scoringFormat: ScoringFormat,
): Promise<PlayerFantasyPerformance[]> {
  const results: PlayerFantasyPerformance[] = [];
  // Fetch the most recent N weeks (assume current week ~ numberOfWeeks for demo)
  for (let w = numberOfWeeks; w >= 1; w--) {
    const perf = await getPlayerFantasyPoints(playerId, season, w, scoringFormat);
    if (perf) results.push(perf);
  }
  return results;
}

// ---- Rankings ----

export async function getPlayerRanking(
  playerId: string,
  week: number,
  scoringFormat: ScoringFormat,
): Promise<PlayerRanking | null> {
  const available = await checkProviderStatus();
  if (!available) return null;

  await ensureCrosswalk();

  const cacheKey = `rank:${week}:${scoringFormat}:${playerId}`;
  const cached = getCached<PlayerRanking>(cacheKey);
  if (cached) return cached;

  try {
    const all = await fetchRankings(getCurrentSeason(), week, scoringFormat);
    const found = all.find((r) => r.playerId === playerId);
    if (found) setCached(cacheKey, found);
    return found ?? null;
  } catch {
    return null;
  }
}

export async function getPositionRankings(
  week: number,
  scoringFormat: ScoringFormat,
  position: string,
): Promise<PlayerRanking[]> {
  const available = await checkProviderStatus();
  if (!available) return [];

  await ensureCrosswalk();

  const cacheKey = `rank:${week}:${scoringFormat}:${position}`;
  const cached = getCached<PlayerRanking[]>(cacheKey);
  if (cached) return cached;

  try {
    const all = await fetchRankings(getCurrentSeason(), week, scoringFormat, position);
    setCached(cacheKey, all);
    return all;
  } catch {
    return [];
  }
}

export async function getWeeklyRankings(
  week: number,
  scoringFormat: ScoringFormat,
): Promise<PlayerRanking[]> {
  return getPositionRankings(week, scoringFormat, 'all');
}

// ---- Injuries ----

export async function getPlayerInjury(playerId: string): Promise<PlayerInjury | null> {
  const available = await checkProviderStatus();
  if (!available) return null;

  await ensureCrosswalk();

  const cacheKey = `injury:all`;
  let all = getCached<PlayerInjury[]>(cacheKey);
  if (!all) {
    try {
      all = await fetchInjuries(getCurrentSeason(), 1);
      setCached(cacheKey, all);
    } catch {
      return null;
    }
  }
  return all.find((i) => i.playerId === playerId) ?? null;
}

export async function getCurrentInjuries(): Promise<PlayerInjury[]> {
  const available = await checkProviderStatus();
  if (!available) return [];

  await ensureCrosswalk();

  const cacheKey = `injury:all`;
  const cached = getCached<PlayerInjury[]>(cacheKey);
  if (cached) return cached;

  try {
    const injuries = await fetchInjuries(getCurrentSeason(), 1);
    setCached(cacheKey, injuries);
    return injuries;
  } catch {
    return [];
  }
}

// ---- News ----

export async function getPlayerNews(playerId: string): Promise<PlayerNews[]> {
  const available = await checkProviderStatus();
  if (!available) return [];

  const cacheKey = `news:${playerId}`;
  const cached = getCached<PlayerNews[]>(cacheKey);
  if (cached) return cached;

  try {
    const news = await fetchPlayerNews(playerId);
    setCached(cacheKey, news);
    return news;
  } catch {
    return [];
  }
}

// ---- Player Fantasy Profile (aggregator) ----

export async function getPlayerFantasyProfile(
  playerId: string,
  options?: {
    season?: number;
    week?: number;
    scoringFormat?: ScoringFormat;
  },
): Promise<FantasyPlayerProfile | null> {
  const season = options?.season ?? getCurrentSeason();
  const week = options?.week ?? getCurrentWeek();
  const scoringFormat = options?.scoringFormat ?? 'Half-PPR';

  // Always get Sleeper identity (real)
  const player = await getPlayerById(playerId);
  if (!player) return null;

  const externalIds: PlayerExternalIds = {
    sleeper: playerId,
    ...(await getPlayerExternalIds(playerId)),
  };

  const fpAvailable = await checkProviderStatus();

  if (!fpAvailable) {
    return {
      player,
      externalIds,
      sources: { sleeper: true, fantasyPros: false },
    };
  }

  await ensureCrosswalk();

  // Fetch all available data — individual failures degrade gracefully.
  const [projection, recentPerf, ranking, injury, news] = await Promise.allSettled([
    getPlayerWeeklyProjection(playerId, season, week, scoringFormat),
    getRecentFantasyPerformance(playerId, season, 3, scoringFormat),
    getPlayerRanking(playerId, week, scoringFormat),
    getPlayerInjury(playerId),
    getPlayerNews(playerId),
  ]);

  return {
    player,
    externalIds,
    weeklyProjection: settledValue(projection) ?? undefined,
    recentPerformance: settledValue(recentPerf) ?? undefined,
    ranking: settledValue(ranking) ?? undefined,
    injury: settledValue(injury) ?? undefined,
    news: settledValue(news) ?? undefined,
    sources: { sleeper: true, fantasyPros: true },
  };
}

// ---- Cache management ----

export function clearFantasyDataCache(): void {
  clearCache();
  resetProviderStatus();
  crosswalkInitialized = false;
}

// ---- Helpers ----

function settledValue<T>(result: PromiseSettledResult<T>): T | undefined {
  if (result.status === 'fulfilled') return result.value;
  return undefined;
}

function getCurrentSeason(): number {
  return new Date().getFullYear();
}

function getCurrentWeek(): number {
  // Approximate current NFL week — NFL season starts early September.
  const now = new Date();
  const seasonStart = new Date(now.getFullYear(), 8, 5); // Sept 5
  const weeksSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, Math.min(18, weeksSinceStart + 1));
}

// Re-export for convenience
export { calculateFantasyPoints } from './scoringEngine';
