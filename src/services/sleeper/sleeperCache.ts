// IndexedDB cache for the Sleeper NFL player database.
// localStorage was too small (~5MB) for the full player DB, so we use
// IndexedDB which has much higher storage limits.

const DB_NAME = 'fantasy-ai-db';
const DB_VERSION = 1;
const STORE_NAME = 'sleeper-players';
const META_STORE = 'meta';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheMeta {
  key: string;
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Stores the full Sleeper player map (playerId -> raw Sleeper player object)
 * in IndexedDB along with a timestamp.
 */
export async function savePlayerCache(
  players: Record<string, unknown>,
): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_NAME, META_STORE], 'readwrite');
    tx.objectStore(STORE_NAME).put(players, 'all-players');
    tx.objectStore(META_STORE).put({ key: 'all-players', timestamp: Date.now() } as CacheMeta);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

/**
 * Retrieves cached players. Returns null if no cache exists.
 * Does NOT check freshness — the caller decides whether to use stale data.
 */
export async function loadPlayerCache(): Promise<{
  players: Record<string, unknown> | null;
  timestamp: number | null;
}> {
  const db = await openDB();
  const result = await new Promise<{
    players: Record<string, unknown> | null;
    timestamp: number | null;
  }>((resolve, reject) => {
    const tx = db.transaction([STORE_NAME, META_STORE], 'readonly');
    const playersReq = tx.objectStore(STORE_NAME).get('all-players');
    const metaReq = tx.objectStore(META_STORE).get('all-players');
    playersReq.onsuccess = () => {
      metaReq.onsuccess = () => {
        const meta = metaReq.result as CacheMeta | undefined;
        resolve({
          players: (playersReq.result as Record<string, unknown>) ?? null,
          timestamp: meta?.timestamp ?? null,
        });
      };
      metaReq.onerror = () => reject(metaReq.error);
    };
    playersReq.onerror = () => reject(playersReq.error);
  });
  db.close();
  return result;
}

/**
 * Returns true if the cache exists and is within the 24h TTL.
 */
export function isCacheFresh(timestamp: number | null): boolean {
  if (timestamp === null) return false;
  return Date.now() - timestamp < CACHE_TTL_MS;
}

/**
 * Clears the player cache entirely.
 */
export async function clearPlayerCache(): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_NAME, META_STORE], 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.objectStore(META_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
