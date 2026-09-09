// Player search service — searches normalized Player objects from the
// Sleeper cache. Supports partial name matching, position filter,
// NFL team filter, and result ranking.

import type { FantasyPosition, NFLTeam, Player } from '@/types';
import { getAllPlayers } from './sleeperService';

export interface PlayerSearchOptions {
  query: string;
  position?: FantasyPosition | null;
  nflTeam?: NFLTeam | null;
  limit?: number;
}

export interface PlayerSearchResult {
  player: Player;
  // 0 = exact match, 1 = prefix match, 2 = partial match
  matchType: 0 | 1 | 2;
}

// Positions that are UI-only slots, not real NFL positions.
const UI_ONLY_POSITIONS = new Set<FantasyPosition>(['FLEX', 'Bench']);

/**
 * Searches normalized Player objects by name, with optional position
 * and NFL team filters. Results are ranked: exact name > prefix > partial.
 *
 * Uses the cached Sleeper player database — no API call per search.
 */
export async function searchPlayers(options: PlayerSearchOptions): Promise<PlayerSearchResult[]> {
  const { query, position, nflTeam, limit = 20 } = options;
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) return [];

  const allPlayers = await getAllPlayers();

  const filtered = allPlayers.filter((p) => {
    // Skip UI-only positions.
    if (UI_ONLY_POSITIONS.has(p.position)) return false;

    // Position filter.
    if (position && !UI_ONLY_POSITIONS.has(position) && p.position !== position) return false;

    // NFL team filter.
    if (nflTeam && p.nflTeam !== nflTeam) return false;

    return true;
  });

  const results: PlayerSearchResult[] = [];

  for (const player of filtered) {
    const nameLower = player.name.toLowerCase();

    let matchType: 0 | 1 | 2 | null = null;
    if (nameLower === normalizedQuery) {
      matchType = 0; // exact
    } else if (nameLower.startsWith(normalizedQuery)) {
      matchType = 1; // prefix
    } else if (nameLower.includes(normalizedQuery)) {
      matchType = 2; // partial
    }

    if (matchType !== null) {
      results.push({ player, matchType });
    }
  }

  // Sort: exact > prefix > partial, then alphabetical within each tier.
  results.sort((a, b) => {
    if (a.matchType !== b.matchType) return a.matchType - b.matchType;
    return a.player.name.localeCompare(b.player.name);
  });

  return results.slice(0, limit);
}
