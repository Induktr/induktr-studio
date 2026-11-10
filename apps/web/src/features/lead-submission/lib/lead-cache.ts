import { deepFreeze } from '@induktr/contracts';

/**
 * Browser Server Cache (Cache API / CacheStorage) & Universal Storage Mirror
 * Persists dynamic lead slugs and payload data with temporary retention (TTL).
 * Supports browser CacheStorage, localStorage, and in-memory fallback.
 */

export interface CachedLeadData {
  slug: string;
  leadId: string;
  name: string;
  contact: string;
  budget: string;
  description: string;
  serviceType: string;
  status: string;
  createdAt: string;
  cachedAt: number;
  expiresAt: number;
}

const CACHE_NAME = 'induktr-lead-cache-v1';
const CACHE_BASE_URL = 'https://induktr.internal/api/leads/';
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const STORAGE_PREFIX = 'induktr_lead_';
const LAST_ACTIVE_KEY = 'induktr_last_active_lead';

// In-memory fallback for environments without persistent storage
const memoryStore = new Map<string, string>();

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== 'undefined' && (globalThis as unknown as { localStorage?: Storage }).localStorage) {
      return (globalThis as unknown as { localStorage: Storage }).localStorage;
    }
  } catch {
    // Restricted environment
  }
  return null;
}

function getCacheStorage(): CacheStorage | null {
  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      return window.caches;
    }
    if (typeof globalThis !== 'undefined' && 'caches' in globalThis) {
      return (globalThis as unknown as { caches: CacheStorage }).caches;
    }
  } catch {
    // Blocked
  }
  return null;
}

export async function saveLeadToBrowserCache(
  slug: string,
  lead: Omit<CachedLeadData, 'cachedAt' | 'expiresAt' | 'slug'>,
  ttlMs = DEFAULT_TTL_MS,
): Promise<CachedLeadData> {
  const now = Date.now();
  const payload: CachedLeadData = {
    ...lead,
    slug,
    cachedAt: now,
    expiresAt: now + ttlMs,
  };

  const serialized = JSON.stringify(payload);

  // 1. Browser Server Cache (Native CacheStorage API)
  const cacheStorage = getCacheStorage();
  if (cacheStorage) {
    try {
      const cache = await cacheStorage.open(CACHE_NAME);
      const response = new Response(serialized, {
        headers: {
          'Content-Type': 'application/json',
          'X-Induktr-Lead': slug,
          'X-Induktr-Expires': String(payload.expiresAt),
          'Cache-Control': `public, max-age=${Math.floor(ttlMs / 1000)}`,
        },
      });
      await cache.put(CACHE_BASE_URL + slug, response);
    } catch {
      // Continue to local storage mirror
    }
  }

  // 2. Synchronous Storage Mirror & Active Session Tracker
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(STORAGE_PREFIX + slug, serialized);
      storage.setItem(LAST_ACTIVE_KEY, slug);
    } catch {
      // Fallback to memoryStore
      memoryStore.set(STORAGE_PREFIX + slug, serialized);
      memoryStore.set(LAST_ACTIVE_KEY, slug);
    }
  } else {
    memoryStore.set(STORAGE_PREFIX + slug, serialized);
    memoryStore.set(LAST_ACTIVE_KEY, slug);
  }

  return deepFreeze(payload);
}

export async function getLeadFromBrowserCache(slug: string): Promise<CachedLeadData | null> {
  if (!slug) return null;
  const now = Date.now();

  // 1. Try Browser Server Cache (CacheStorage API)
  const cacheStorage = getCacheStorage();
  if (cacheStorage) {
    try {
      const cache = await cacheStorage.open(CACHE_NAME);
      const match = await cache.match(CACHE_BASE_URL + slug);
      if (match) {
        const data = (await match.json()) as CachedLeadData;
        if (data && data.expiresAt > now) {
          return deepFreeze(data);
        }
        await cache.delete(CACHE_BASE_URL + slug);
      }
    } catch {
      // Fall through
    }
  }

  // 2. Fallback to LocalStorage Mirror or Memory
  const storage = getStorage();
  const raw = storage ? storage.getItem(STORAGE_PREFIX + slug) : memoryStore.get(STORAGE_PREFIX + slug);

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as CachedLeadData;
      if (parsed && parsed.expiresAt > now) {
        return deepFreeze(parsed);
      }
      // Expired: prune
      if (storage) {
        storage.removeItem(STORAGE_PREFIX + slug);
        if (storage.getItem(LAST_ACTIVE_KEY) === slug) {
          storage.removeItem(LAST_ACTIVE_KEY);
        }
      }
      memoryStore.delete(STORAGE_PREFIX + slug);
      if (memoryStore.get(LAST_ACTIVE_KEY) === slug) {
        memoryStore.delete(LAST_ACTIVE_KEY);
      }
    } catch {
      return null;
    }
  }

  return null;
}

export async function clearLeadFromBrowserCache(slug: string): Promise<void> {
  if (!slug) return;

  const cacheStorage = getCacheStorage();
  if (cacheStorage) {
    try {
      const cache = await cacheStorage.open(CACHE_NAME);
      await cache.delete(CACHE_BASE_URL + slug);
    } catch {
      // Ignore
    }
  }

  const storage = getStorage();
  if (storage) {
    try {
      storage.removeItem(STORAGE_PREFIX + slug);
      if (storage.getItem(LAST_ACTIVE_KEY) === slug) {
        storage.removeItem(LAST_ACTIVE_KEY);
      }
    } catch {
      // Ignore
    }
  }

  memoryStore.delete(STORAGE_PREFIX + slug);
  if (memoryStore.get(LAST_ACTIVE_KEY) === slug) {
    memoryStore.delete(LAST_ACTIVE_KEY);
  }
}

export function getLastActiveLeadSlug(): string | null {
  const storage = getStorage();
  if (storage) {
    try {
      return storage.getItem(LAST_ACTIVE_KEY);
    } catch {
      return memoryStore.get(LAST_ACTIVE_KEY) ?? null;
    }
  }
  return memoryStore.get(LAST_ACTIVE_KEY) ?? null;
}

export function pruneExpiredEntries(): void {
  const now = Date.now();
  const storage = getStorage();

  if (storage) {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          const raw = storage.getItem(key);
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as CachedLeadData;
              if (parsed && typeof parsed.expiresAt === 'number' && parsed.expiresAt <= now) {
                keysToRemove.push(key);
              }
            } catch {
              keysToRemove.push(key);
            }
          }
        }
      }
      for (const key of keysToRemove) {
        storage.removeItem(key);
        const slug = key.slice(STORAGE_PREFIX.length);
        if (storage.getItem(LAST_ACTIVE_KEY) === slug) {
          storage.removeItem(LAST_ACTIVE_KEY);
        }
      }
    } catch {
      // Ignore storage access error
    }
  }

  for (const [key, raw] of memoryStore.entries()) {
    if (key.startsWith(STORAGE_PREFIX)) {
      try {
        const parsed = JSON.parse(raw) as CachedLeadData;
        if (parsed && typeof parsed.expiresAt === 'number' && parsed.expiresAt <= now) {
          memoryStore.delete(key);
          const slug = key.slice(STORAGE_PREFIX.length);
          if (memoryStore.get(LAST_ACTIVE_KEY) === slug) {
            memoryStore.delete(LAST_ACTIVE_KEY);
          }
        }
      } catch {
        memoryStore.delete(key);
      }
    }
  }

  const cacheStorage = getCacheStorage();
  if (cacheStorage) {
    void cacheStorage.open(CACHE_NAME).then(async (cache) => {
      const requests = await cache.keys();
      for (const req of requests) {
        const resp = await cache.match(req);
        if (resp) {
          try {
            const data = (await resp.json()) as CachedLeadData;
            if (data && typeof data.expiresAt === 'number' && data.expiresAt <= now) {
              await cache.delete(req);
            }
          } catch {
            await cache.delete(req);
          }
        }
      }
    }).catch(() => {});
  }
}

// Module initialization call for passive cache pruning
pruneExpiredEntries();

