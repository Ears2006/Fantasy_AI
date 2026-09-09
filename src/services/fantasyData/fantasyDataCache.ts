// In-memory cache for fantasy data with per-key TTLs.
// Different data types have different freshness requirements.
// Large datasets are NOT stored here — only API response payloads.
// The Sleeper player DB uses IndexedDB (see sleeperCache.ts).

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

// Centralized TTL configuration (in milliseconds).
export const CACHE_TTL = {
  weeklyProjections: 3 * 60 * 60 * 1000,      // 3 hours
  rankings: 3 * 60 * 60 * 1000,                // 3 hours
  injuries: 30 * 60 * 1000,                    // 30 minutes
  news: 30 * 60 * 1000,                        // 30 minutes
  playerProfile: 30 * 60 * 1000,               // 30 minutes
  historicalPerformance: 24 * 60 * 60 * 1000,  // 24 hours (completed weeks don't change)
  crosswalk: 24 * 60 * 60 * 1000,              // 24 hours
} as const;

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > getTtlForKey(key)) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCached<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function clearCache(prefix?: string): void {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

function getTtlForKey(key: string): number {
  if (key.startsWith('proj:')) return CACHE_TTL.weeklyProjections;
  if (key.startsWith('rank:')) return CACHE_TTL.rankings;
  if (key.startsWith('injury:')) return CACHE_TTL.injuries;
  if (key.startsWith('news:')) return CACHE_TTL.news;
  if (key.startsWith('profile:')) return CACHE_TTL.playerProfile;
  if (key.startsWith('perf:')) return CACHE_TTL.historicalPerformance;
  if (key.startsWith('crosswalk:')) return CACHE_TTL.crosswalk;
  return 30 * 60 * 1000; // default 30 min
}
