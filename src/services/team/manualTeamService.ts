// Local persistence for manual team and league data.
// Small data (rosters, settings) uses localStorage.
// The large Sleeper player database uses IndexedDB (see sleeperCache.ts).
//
// // TODO-INTEGRATION: AUTH_DATABASE_PERSISTENCE
// When Supabase auth is connected, replace these localStorage functions
// with Supabase table queries scoped to auth.uid().

import type { ManualLeague, ManualTeam, LeagueScoringSettings, ScoringFormat } from '@/types';
import { uid } from '@/services/utils/uid';

const TEAM_KEY = 'ffa.manual.team.v1';
const LEAGUE_KEY = 'ffa.manual.league.v1';

const DEFAULT_SCORING: LeagueScoringSettings = {
  format: 'Half-PPR',
  passingTdPoints: 4,
  passingYardsPerPoint: 25,
  interceptionPoints: -2,
  rushingTdPoints: 6,
  rushingYardsPerPoint: 10,
  receivingYardsPerPoint: 10,
  receivingTdPoints: 6,
  receptionPoints: 0.5,
  fumblePoints: -2,
  teams: 12,
  qbSlots: 1,
  rbSlots: 2,
  wrSlots: 2,
  teSlots: 1,
  flexSlots: 1,
  benchSlots: 6,
  kickerEnabled: true,
  defenseEnabled: true,
};

const SCORING_PRESETS: Record<ScoringFormat, Partial<LeagueScoringSettings>> = {
  Standard: { format: 'Standard', receptionPoints: 0 },
  'Half-PPR': { format: 'Half-PPR', receptionPoints: 0.5 },
  'Full-PPR': { format: 'Full-PPR', receptionPoints: 1.0 },
  PPR: { format: 'PPR', receptionPoints: 1.0 },
};

export function getScoringPresets(): Record<ScoringFormat, Partial<LeagueScoringSettings>> {
  return SCORING_PRESETS;
}

export function getDefaultScoring(): LeagueScoringSettings {
  return { ...DEFAULT_SCORING };
}

// ---- Manual League ----

export function loadManualLeague(): ManualLeague | null {
  try {
    const raw = localStorage.getItem(LEAGUE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ManualLeague;
  } catch {
    return null;
  }
}

export function saveManualLeague(scoring: LeagueScoringSettings, name: string): ManualLeague {
  const existing = loadManualLeague();
  const league: ManualLeague = {
    id: existing?.id ?? uid(),
    name,
    scoring,
    createdAt: existing?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  };
  try {
    localStorage.setItem(LEAGUE_KEY, JSON.stringify(league));
  } catch {
    // localStorage may be unavailable; fail silently.
  }
  return league;
}

// ---- Manual Team ----

export function loadManualTeam(): ManualTeam | null {
  try {
    const raw = localStorage.getItem(TEAM_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ManualTeam;
  } catch {
    return null;
  }
}

export function saveManualTeam(team: ManualTeam): void {
  try {
    localStorage.setItem(TEAM_KEY, JSON.stringify(team));
  } catch {
    // ignore
  }
}

export function createManualTeam(name: string, leagueId: string): ManualTeam {
  const team: ManualTeam = {
    id: uid(),
    name,
    leagueId,
    roster: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  saveManualTeam(team);
  return team;
}

export function updateManualTeam(team: ManualTeam): void {
  team.updatedAt = Date.now();
  saveManualTeam(team);
}

export function clearManualData(): void {
  try {
    localStorage.removeItem(TEAM_KEY);
    localStorage.removeItem(LEAGUE_KEY);
  } catch {
    // ignore
  }
}
