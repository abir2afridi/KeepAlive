import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), 'server', 'cache', 'storage.json');
const CACHE_DIR = path.dirname(CACHE_FILE);

// Ensure directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

interface CacheEntry {
  data: any;
  expiresAt: number;
}

interface GlobalCacheStore {
  monitors: Record<string, CacheEntry>;
  stats: Record<string, CacheEntry>;
  users: Record<string, CacheEntry>; // Cache for auth lookups
}

let cacheStore: GlobalCacheStore = { monitors: {}, stats: {}, users: {} };

// Load cache from disk
try {
  if (fs.existsSync(CACHE_FILE)) {
    cacheStore = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    console.log('[CACHE] Global storage loaded.');
  }
} catch (e) {
  console.error('[CACHE] Failed to load store:', e);
}

export function saveCache() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheStore), 'utf8');
  } catch (e) {
    console.error('[CACHE] Failed to save store:', e);
  }
}

export const cache = {
  get: (type: keyof GlobalCacheStore, key: string) => {
    const entry = cacheStore[type][key];
    if (entry && entry.expiresAt > Date.now()) {
      return entry.data;
    }
    return null;
  },
  getStale: (type: keyof GlobalCacheStore, key: string) => {
    return cacheStore[type][key]?.data || null;
  },
  set: (type: keyof GlobalCacheStore, key: string, data: any, ttlMs: number) => {
    cacheStore[type][key] = {
      data,
      expiresAt: Date.now() + ttlMs
    };
    saveCache();
  },
  delete: (type: keyof GlobalCacheStore, key: string) => {
    delete cacheStore[type][key];
    saveCache();
  },
  clearUser: (userId: string) => {
    delete cacheStore.monitors[userId];
    delete cacheStore.stats[userId];
    saveCache();
  }
};
