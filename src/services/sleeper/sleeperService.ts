// Sleeper API service — fetches active NFL players from the Sleeper API,
// caches them in IndexedDB (24h TTL), and exposes normalized Player objects.

import type { Player } from '@/types';
import { isCacheFresh, loadPlayerCache, savePlayerCache, clearPlayerCache } from './sleeperCache';
import { mapSleeperPlayer, mapSleeperPlayers, type RawSleeperPlayer } from './sleeperMapper';

const SLEEPER_API = 'https://api.sleeper.app/v1';

let inMemoryPlayers: Player[] | null = null;
let inMemoryRawMap: Record<string, RawSleeperPlayer> | null = null;

/**
 * Fetches the full active NFL player list from Sleeper and caches it.
 * This is a large response (~1-2MB) — only called when the cache is stale.
 */
async function fetchSleeperPlayersFromApi(): Promise<Record<string, RawSleeperPlayer>> {
  const response = await fetch(`${SLEEPER_API}/players/nfl`);
  if (!response.ok) {
    throw new Error(`Sleeper API failed with status ${response.status}`);
  }
  const raw = await response.json() as Record<string, RawSleeperPlayer>;
  await savePlayerCache(raw as Record<string, unknown>);
  return raw;
}

/**
 * Returns the raw Sleeper player map, using cache when fresh.
 * If the cache is stale, attempts a fresh fetch. If the fetch fails
 * but stale cached data exists, falls back to the stale cache.
 */
async function getRawPlayerMap(): Promise<Record<string, RawSleeperPlayer>> {
  if (inMemoryRawMap) return inMemoryRawMap;

  const cached = await loadPlayerCache();
  const cachedRaw = cached.players as Record<string, RawSleeperPlayer> | null;

  if (cachedRaw && isCacheFresh(cached.timestamp)) {
    inMemoryRawMap = cachedRaw;
    return inMemoryRawMap;
  }

  // Cache is stale or missing — try to refresh.
  try {
    inMemoryRawMap = await fetchSleeperPlayersFromApi();
    return inMemoryRawMap;
  } catch (err) {
    // Refresh failed — fall back to stale cache if it exists.
    if (cachedRaw) {
      inMemoryRawMap = cachedRaw;
      return inMemoryRawMap;
    }
    throw err;
  }
}

/**
 * Returns all active NFL players as normalized Player objects.
 * Uses IndexedDB cache (24h TTL) with automatic refresh.
 * Falls back to stale cache if the API is unreachable.
 */
export async function getAllPlayers(): Promise<Player[]> {
  if (inMemoryPlayers) return inMemoryPlayers;

  const rawMap = await getRawPlayerMap();
  const raws = Object.values(rawMap);
  inMemoryPlayers = mapSleeperPlayers(raws);
  return inMemoryPlayers;
}

/**
 * Returns a single normalized Player by Sleeper player ID.
 * Uses the cached player database — no individual API call needed.
 *
 * // TODO-INTEGRATION: PLAYER_STATS
 * This provides real player identity data from Sleeper. Weekly stats,
 * projections, and advanced metrics still need a stats provider.
 */
export async function getPlayerById(playerId: string): Promise<Player | null> {
  const rawMap = await getRawPlayerMap();
  const raw = rawMap[playerId];
  if (!raw) return null;
  return mapSleeperPlayer(raw);
}

/**
 * Returns the raw Sleeper player map for services that need
 * fields beyond the normalized Player type (e.g. fantasy_positions).
 */
export async function getRawPlayers(): Promise<Record<string, RawSleeperPlayer>> {
  return getRawPlayerMap();
}

/**
 * Clears the IndexedDB player cache and in-memory cache.
 * The next call to getAllPlayers() will trigger a fresh fetch.
 */
export async function refreshPlayerCache(): Promise<void> {
  inMemoryPlayers = null;
  inMemoryRawMap = null;
  await clearPlayerCache();
}

/**
 * Returns cache metadata for UI display (last updated timestamp).
 */
export async function getCacheInfo(): Promise<{ timestamp: number | null; fresh: boolean }> {
  const cached = await loadPlayerCache();
  return {
    timestamp: cached.timestamp,
    fresh: isCacheFresh(cached.timestamp),
  };
}
