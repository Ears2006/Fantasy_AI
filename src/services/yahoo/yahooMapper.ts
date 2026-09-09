// Maps raw Yahoo Fantasy API responses into the app's provider-neutral types.
// Yahoo's API returns deeply nested JSON — this module extracts and normalizes it.

import type {
  ProviderLeague,
  ProviderTeam,
  ProviderRosterEntry,
  ProviderMatchup,
  LeagueScoringSettings,
  ScoringFormat,
  YahooScoringCategory,
  YahooLeagueSettings,
  FantasyPosition,
  NFLTeam,
} from '@/types';
import type {
  RawYahooLeague,
  RawYahooScoringCategory,
  RawYahooRosterPosition,
  RawYahooTeam,
  RawYahooRosterPlayer,
  RawYahooMatchup,
} from './yahooTypes';

// ---- Yahoo response navigation helpers ----
// Yahoo wraps data in fantasy_content > games > game > leagues > league > ...

function navigateYahooResponse(data: unknown, keys: string[]): unknown {
  let current: unknown = data;
  for (const key of keys) {
    if (current === null || current === undefined) return null;
    if (typeof current !== 'object') return null;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') return [value as T];
  return [];
}

// ---- League mapper ----

export function mapYahooLeagues(data: unknown): ProviderLeague[] {
  // Path: fantasy_content > users > 0 > user > games > ...
  const games = navigateYahooResponse(data, ["fantasy_content", "users", "0", "user", "games"]);
  if (!games || typeof games !== 'object') return [];

  const gameObj = (games as Record<string, unknown>)["0"];
  if (!gameObj) return [];

  const leaguesWrapper = (gameObj as Record<string, unknown>)["games"];
  if (!leaguesWrapper) return [];

  const gameData = (leaguesWrapper as Record<string, unknown>)["0"];
  if (!gameData) return [];

  const leaguesData = (gameData as Record<string, unknown>)["game"];
  if (!leaguesData) return [];

  const leaguesObj = (leaguesData as Record<string, unknown>)["leagues"];
  if (!leaguesObj) return [];

  // Leagues are indexed as "0", "1", etc.
  const leagues: ProviderLeague[] = [];
  const leagueEntries = Object.entries(leaguesObj as Record<string, unknown>);
  for (const [, entry] of leagueEntries) {
    const league = (entry as Record<string, unknown>)["league"];
    if (!league) continue;
    const raw = league as RawYahooLeague;
    if (raw.league_key) {
      leagues.push({
        providerLeagueId: raw.league_key,
        provider: 'yahoo',
        name: raw.name ?? 'Unknown League',
        season: parseInt(raw.season ?? '0', 10),
        numberOfTeams: parseInt(String(raw.num_teams ?? '0'), 10),
        currentWeek: parseInt(String(raw.current_week ?? '0'), 10),
        scoringType: raw.scoring_type,
        draftStatus: raw.draft_status,
      });
    }
  }
  return leagues;
}

// ---- Scoring settings mapper ----

// Yahoo stat_id to our scoring engine mapping.
// Based on Yahoo's documented stat categories for NFL fantasy.
const YAHOO_STAT_MAP: Record<number, {
  key: keyof LeagueScoringSettings;
  isPerUnit?: boolean;
  label: string;
}> = {
  4: { key: 'passingTdPoints', label: 'Passing TDs' },
  5: { key: 'passingYardsPerPoint', label: 'Passing Yards', isPerUnit: true },
  7: { key: 'interceptionPoints', label: 'Interceptions' },
  10: { key: 'rushingTdPoints', label: 'Rushing TDs' },
  11: { key: 'rushingYardsPerPoint', label: 'Rushing Yards', isPerUnit: true },
  12: { key: 'receivingTdPoints', label: 'Receiving TDs' },
  13: { key: 'receivingYardsPerPoint', label: 'Receiving Yards', isPerUnit: true },
  14: { key: 'receptionPoints', label: 'Receptions (PPR)' },
  19: { key: 'fumblePoints', label: 'Fumbles' },
};

export function mapYahooLeagueSettings(data: unknown): YahooLeagueSettings {
  const settings = navigateYahooResponse(data, ["fantasy_content", "league", "settings"]);
  if (!settings || typeof settings !== 'object') {
    return { scoring: getDefaultYahooScoring(), rawYahooScoring: [], unsupportedCategories: [] };
  }

  const settingsObj = settings as Record<string, unknown>;
  const rawCategories = asArray<RawYahooScoringCategory>(settingsObj["stat_categories"]);

  const scoring: Partial<LeagueScoringSettings> = {};
  const rawYahooScoring: YahooScoringCategory[] = [];
  const unsupportedCategories: YahooScoringCategory[] = [];

  for (const cat of rawCategories) {
    const statId = cat.stat_id;
    const value = typeof cat.value === 'string' ? parseFloat(cat.value) : cat.value;

    const yahooCat: YahooScoringCategory = {
      yahooKey: String(statId),
      yahooLabel: cat.display_name ?? cat.name ?? `Stat ${statId}`,
      value: isNaN(value) ? 0 : value,
      supported: false,
    };

    const mapping = YAHOO_STAT_MAP[statId];
    if (mapping) {
      yahooCat.supported = true;
      if (mapping.isPerUnit) {
        // Yahoo stores yards per point (e.g. 25 means 1 point per 25 yards)
        (scoring[mapping.key] as number) = value;
      } else {
        // Yahoo stores points per event (e.g. 6 for a TD, -2 for INT)
        (scoring[mapping.key] as number) = value;
      }
    }

    rawYahooScoring.push(yahooCat);
    if (!mapping) {
      unsupportedCategories.push(yahooCat);
    }
  }

  // Determine scoring format from reception points
  const receptionPoints = scoring.receptionPoints ?? 0;
  const format: ScoringFormat = receptionPoints === 0 ? 'Standard'
    : receptionPoints === 0.5 ? 'Half-PPR'
    : receptionPoints >= 1 ? 'Full-PPR'
    : 'Standard';

  // Get roster positions for slot configuration
  const rosterPositions = asArray<RawYahooRosterPosition>(settingsObj["roster_positions"]);
  const slotConfig = mapRosterSlots(rosterPositions);

  const fullScoring: LeagueScoringSettings = {
    format,
    passingTdPoints: scoring.passingTdPoints ?? 4,
    passingYardsPerPoint: scoring.passingYardsPerPoint ?? 25,
    interceptionPoints: scoring.interceptionPoints ?? -2,
    rushingTdPoints: scoring.rushingTdPoints ?? 6,
    rushingYardsPerPoint: scoring.rushingYardsPerPoint ?? 10,
    receivingYardsPerPoint: scoring.receivingYardsPerPoint ?? 10,
    receivingTdPoints: scoring.receivingTdPoints ?? 6,
    receptionPoints: scoring.receptionPoints ?? 0,
    fumblePoints: scoring.fumblePoints ?? -2,
    teams: 12,
    qbSlots: slotConfig.qbSlots ?? 1,
    rbSlots: slotConfig.rbSlots ?? 2,
    wrSlots: slotConfig.wrSlots ?? 2,
    teSlots: slotConfig.teSlots ?? 1,
    flexSlots: slotConfig.flexSlots ?? 1,
    benchSlots: slotConfig.benchSlots ?? 6,
    kickerEnabled: slotConfig.kickerEnabled ?? true,
    defenseEnabled: slotConfig.defenseEnabled ?? true,
  };

  return { scoring: fullScoring, rawYahooScoring, unsupportedCategories };
}

function mapRosterSlots(positions: RawYahooRosterPosition[]): Partial<LeagueScoringSettings> {
  const config: Partial<LeagueScoringSettings> = {
    qbSlots: 1, rbSlots: 2, wrSlots: 2, teSlots: 1,
    flexSlots: 1, benchSlots: 6,
    kickerEnabled: true, defenseEnabled: true,
  };

  for (const pos of positions) {
    switch (pos.position) {
      case 'QB': config.qbSlots = pos.count; break;
      case 'RB': config.rbSlots = pos.count; break;
      case 'WR': config.wrSlots = pos.count; break;
      case 'TE': config.teSlots = pos.count; break;
      case 'W/R/T': config.flexSlots = pos.count; break;
      case 'BN': config.benchSlots = pos.count; break;
      case 'K': config.kickerEnabled = pos.count > 0; break;
      case 'DEF': config.defenseEnabled = pos.count > 0; break;
    }
  }

  return config;
}

function getDefaultYahooScoring(): LeagueScoringSettings {
  return {
    format: 'Standard',
    passingTdPoints: 4,
    passingYardsPerPoint: 25,
    interceptionPoints: -2,
    rushingTdPoints: 6,
    rushingYardsPerPoint: 10,
    receivingYardsPerPoint: 10,
    receivingTdPoints: 6,
    receptionPoints: 0,
    fumblePoints: -2,
    teams: 12,
    qbSlots: 1, rbSlots: 2, wrSlots: 2, teSlots: 1, flexSlots: 1, benchSlots: 6,
    kickerEnabled: true, defenseEnabled: true,
  };
}

// ---- Team mapper ----

export function mapYahooTeams(data: unknown): ProviderTeam[] {
  const teams = navigateYahooResponse(data, ["fantasy_content", "league", "teams"]);
  if (!teams || typeof teams !== 'object') return [];

  const teamsArr: ProviderTeam[] = [];
  const teamEntries = Object.entries(teams as Record<string, unknown>);
  for (const [, entry] of teamEntries) {
    const team = (entry as Record<string, unknown>)["team"];
    if (!team) continue;
    const raw = team as RawYahooTeam;
    const manager = raw.managers?.[0];
    const standings = raw.team_standings;

    teamsArr.push({
      providerTeamId: raw.team_key,
      providerLeagueId: '', // filled by caller
      name: raw.name ?? 'Unknown Team',
      managerName: manager?.nickname ?? 'Unknown Manager',
      managerIsUser: false, // determined by caller comparing guid
      record: standings ? {
        wins: standings.outcome_totals?.wins ?? 0,
        losses: standings.outcome_totals?.losses ?? 0,
        ties: standings.outcome_totals?.ties ?? 0,
      } : { wins: 0, losses: 0, ties: 0 },
    });
  }
  return teamsArr;
}

// ---- User team mapper ----

export function mapYahooUserTeam(data: unknown): ProviderTeam | null {
  const teams = navigateYahooResponse(data, ["fantasy_content", "users", "0", "user", "teams"]);
  if (!teams || typeof teams !== 'object') return null;

  const teamEntry = Object.values(teams as Record<string, unknown>)[0];
  if (!teamEntry) return null;

  const team = (teamEntry as Record<string, unknown>)["team"];
  if (!team) return null;

  const raw = team as RawYahooTeam;
  const manager = raw.managers?.[0];

  return {
    providerTeamId: raw.team_key,
    providerLeagueId: '',
    name: raw.name ?? 'My Team',
    managerName: manager?.nickname ?? 'You',
    managerIsUser: true,
    record: raw.team_standings ? {
      wins: raw.team_standings.outcome_totals?.wins ?? 0,
      losses: raw.team_standings.outcome_totals?.losses ?? 0,
      ties: raw.team_standings.outcome_totals?.ties ?? 0,
    } : { wins: 0, losses: 0, ties: 0 },
  };
}

// ---- Roster mapper ----

export function mapYahooRoster(data: unknown): ProviderRosterEntry[] {
  const roster = navigateYahooResponse(data, ["fantasy_content", "team", "roster"]);
  if (!roster || typeof roster !== 'object') return [];

  const playersWrapper = (roster as Record<string, unknown>)["0"];
  if (!playersWrapper) return [];

  const playersObj = (playersWrapper as Record<string, unknown>)["players"];
  if (!playersObj || typeof playersObj !== 'object') return [];

  const entries: ProviderRosterEntry[] = [];
  const playerEntries = Object.entries(playersObj as Record<string, unknown>);
  for (const [, entry] of playerEntries) {
    const player = (entry as Record<string, unknown>)["player"];
    if (!player) continue;
    const raw = player as RawYahooRosterPlayer;

    const selectedPos = raw.selected_position?.position ?? 'BN';
    const isStarter = selectedPos !== 'BN' && !selectedPos.startsWith('BN');

    entries.push({
      providerPlayerId: raw.player_id ?? '',
      yahooPlayerKey: raw.player_key,
      playerName: raw.name?.full ?? 'Unknown Player',
      position: normalizePosition(raw.display_position) ?? 'Bench',
      nflTeam: normalizeTeam(raw.editorial_team_abbr) ?? 'ARI',
      slot: selectedPos,
      eligiblePositions: raw.eligible_positions,
      byeWeek: raw.bye_weeks?.week ? parseInt(raw.bye_weeks.week, 10) : undefined,
      injuryStatus: raw.status_full ?? raw.status,
      isStarter,
    });
  }
  return entries;
}

// ---- Matchup mapper ----

export function mapYahooMatchup(data: unknown): ProviderMatchup | null {
  const matchups = navigateYahooResponse(data, ["fantasy_content", "team", "matchups"]);
  if (!matchups || typeof matchups !== 'object') return null;

  // Get the first (current) matchup
  const matchupEntry = Object.values(matchups as Record<string, unknown>)[0];
  if (!matchupEntry) return null;

  const matchup = (matchupEntry as Record<string, unknown>)["matchup"];
  if (!matchup) return null;

  const raw = matchup as RawYahooMatchup;
  const teams = raw.teams ?? [];
  if (teams.length < 2) return null;

  const userTeam = teams.find(t => t.is_owner === "1") ?? teams[0];
  const opponentTeam = teams.find(t => t !== userTeam) ?? teams[1];

  return {
    week: parseInt(raw.week, 10),
    userTeamId: userTeam?.team_key ?? '',
    userTeamName: userTeam?.name ?? '',
    userProjected: parseFloat(userTeam?.team_projected_points?.total ?? '0'),
    userActual: userTeam?.team_points?.total ? parseFloat(userTeam.team_points.total) : undefined,
    opponentTeamId: opponentTeam?.team_key ?? '',
    opponentTeamName: opponentTeam?.name ?? '',
    opponentProjected: parseFloat(opponentTeam?.team_projected_points?.total ?? '0'),
    opponentActual: opponentTeam?.team_points?.total ? parseFloat(opponentTeam.team_points.total) : undefined,
    matchupState: raw.status,
  };
}

// ---- Position / team normalization ----

const VALID_POSITIONS: ReadonlySet<string> = new Set(['QB', 'RB', 'WR', 'TE', 'K', 'DEF', 'DST', 'D/ST', 'PK']);

function normalizePosition(pos: string | undefined): FantasyPosition | null {
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
  'JAC', // Yahoo sometimes uses JAC instead of JAX
]);

function normalizeTeam(team: string | undefined): NFLTeam | null {
  if (!team) return null;
  const upper = team.toUpperCase().trim();
  const normalized = upper === 'JAC' ? 'JAX' : upper;
  if (!VALID_NFL_TEAMS.has(normalized)) return null;
  return normalized as NFLTeam;
}
