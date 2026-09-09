// Player ID crosswalk — maps between Sleeper player IDs and FantasyPros player IDs.
// Uses name + team + position matching as the primary strategy, with caching.

import type { Player, PlayerExternalIds } from '@/types';
import { getAllPlayers, getRawPlayers } from '@/services/sleeper/sleeperService';
import type { RawSleeperPlayer } from '@/services/sleeper/sleeperMapper';
import { getCached, setCached } from './fantasyDataCache';
import { normalizePosition, normalizeTeam, type RawFPPlayer } from './fantasyDataMapper';

// In-memory crosswalk map: Sleeper ID -> PlayerExternalIds
let crosswalkMap: Map<string, PlayerExternalIds> | null = null;

// Reverse map: FantasyPros ID (string) -> Sleeper ID
let fpToSleeperMap: Map<string, string> | null = null;

/**
 * Builds the crosswalk by matching FantasyPros player metadata
 * against the normalized Sleeper player database.
 *
 * Matching priority:
 * 1. Direct external ID (Sleeper's espn_id/yahoo_id if FantasyPros provides the same)
 * 2. Exact normalized name + NFL team + position
 * 3. Exact normalized name + position (ambiguous — only used if exactly 1 match)
 */
export async function buildPlayerCrosswalk(
  fpPlayers: RawFPPlayer[],
): Promise<Map<string, PlayerExternalIds>> {
  if (crosswalkMap) return crosswalkMap;

  const cached = getCached<Map<string, PlayerExternalIds>>('crosswalk:all');
  if (cached) {
    crosswalkMap = cached;
    fpToSleeperMap = buildReverseMap(cached);
    return cached;
  }

  const sleeperPlayers = await getAllPlayers();
  const sleeperRaw = await getRawPlayers();

  // Build lookup indexes from Sleeper data
  const byNameTeamPos = new Map<string, Player>();
  const byNamePos = new Map<string, Player[]>();
  const sleeperRawById = new Map<string, RawSleeperPlayer>();

  for (const raw of Object.values(sleeperRaw)) {
    if (!raw.player_id) continue;
    sleeperRawById.set(raw.player_id, raw);
  }

  for (const p of sleeperPlayers) {
    const nameKey = normalizeName(p.name);
    const teamPosKey = `${nameKey}|${p.nflTeam}|${p.position}`;
    byNameTeamPos.set(teamPosKey, p);

    const namePosKey = `${nameKey}|${p.position}`;
    const existing = byNamePos.get(namePosKey);
    if (existing) existing.push(p);
    else byNamePos.set(namePosKey, [p]);
  }

  const result = new Map<string, PlayerExternalIds>();

  for (const fp of fpPlayers) {
    const fpId = String(fp.player_id);
    if (!fpId) continue;

    const fpName = normalizeName(fp.player_name ?? '');
    const fpTeam = normalizeTeam(fp.team_id);
    const fpPos = normalizePosition(fp.position_id);

    if (!fpName) continue;

    // Strategy 1: exact name + team + position
    let matchedPlayer: Player | null = null;

    if (fpTeam && fpPos) {
      const key = `${fpName}|${fpTeam}|${fpPos}`;
      matchedPlayer = byNameTeamPos.get(key) ?? null;
    }

    // Strategy 2: exact name + position (may be ambiguous)
    if (!matchedPlayer && fpPos) {
      const key = `${fpName}|${fpPos}`;
      const candidates = byNamePos.get(key);
      if (candidates && candidates.length === 1) {
        matchedPlayer = candidates[0];
      }
      // If multiple candidates, we skip — ambiguous match is dangerous
    }

    if (matchedPlayer) {
      const raw = sleeperRawById.get(matchedPlayer.id);
      const existing = result.get(matchedPlayer.id);
      result.set(matchedPlayer.id, {
        ...existing,
        sleeper: matchedPlayer.id,
        fantasyPros: fpId,
        yahoo: raw?.yahoo_id ? String(raw.yahoo_id) : (fp.player_yahoo_id ? String(fp.player_yahoo_id) : existing?.yahoo),
        espn: raw?.espn_id ? String(raw.espn_id) : existing?.espn,
      });
    }
  }

  crosswalkMap = result;
  fpToSleeperMap = buildReverseMap(result);
  setCached('crosswalk:all', result);
  return result;
}

/**
 * Returns the FantasyPros player ID for a given Sleeper player ID.
 */
export async function getFantasyProsId(sleeperPlayerId: string): Promise<string | null> {
  if (!crosswalkMap) return null;
  const ids = crosswalkMap.get(sleeperPlayerId);
  return ids?.fantasyPros ?? null;
}

/**
 * Returns the Sleeper player ID for a given FantasyPros player ID.
 */
export async function findNormalizedPlayerByFantasyProsId(fpPlayerId: string): Promise<string | null> {
  if (!fpToSleeperMap) return null;
  return fpToSleeperMap.get(fpPlayerId) ?? null;
}

/**
 * Returns all known external IDs for a Sleeper player.
 */
export async function getPlayerExternalIds(sleeperPlayerId: string): Promise<PlayerExternalIds | null> {
  if (!crosswalkMap) return null;
  return crosswalkMap.get(sleeperPlayerId) ?? null;
}

/**
 * Clears the crosswalk cache (forces rebuild on next access).
 */
export function clearCrosswalk(): void {
  crosswalkMap = null;
  fpToSleeperMap = null;
}

// ---- helpers ----

function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\./g, '').replace(/\s+/g, ' ');
}

function buildReverseMap(map: Map<string, PlayerExternalIds>): Map<string, string> {
  const reverse = new Map<string, string>();
  for (const [sleeperId, ids] of map) {
    if (ids.fantasyPros) {
      reverse.set(ids.fantasyPros, sleeperId);
    }
  }
  return reverse;
}
