/**
 * Redis Cache Layer for KeepAlive
 * 
 * Architecture:
 *   Ping Worker → Redis (real-time status)
 *   Dashboard  → Redis (live reads)
 *   Firestore  → only for history/analytics (batched writes every 5 min)
 * 
 * Fallback: In-memory Map when Redis is unavailable (local dev)
 */
import IORedis, { RedisOptions } from 'ioredis';

const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 1,
  retryStrategy: (times) => {
    if (times > 1) return null; // Very aggressive fallback for local dev
    return 200;
  },
  connectTimeout: 2000,
  lazyConnect: true,
};

// ─── Redis Connection ──────────────────────────────────────────────────────────

let redis: IORedis | null = null;
let redisAvailable = false;

let lastRedisLogTs = 0;
const logRedisOncePer = (ms: number, level: 'log' | 'warn' | 'error', msg: string, err?: unknown) => {
  const now = Date.now();
  if (now - lastRedisLogTs < ms) return;
  lastRedisLogTs = now;
  if (level === 'log') console.log(msg, err ?? '');
  else if (level === 'warn') console.warn(msg, err ?? '');
  else console.error(msg, err ?? '');
};

const initRedis = async () => {
  try {
    redis = new IORedis(redisConfig);

    // Avoid unhandled 'error' event crashes
    redis.on('error', (err) => {
      if (redisAvailable) {
        console.warn('[REDIS] ⚠️ Connection lost — falling back to in-memory cache.');
      } else {
        // ECONNREFUSED can be very noisy during local dev
        logRedisOncePer(10_000, 'warn', '[REDIS] ❌ Connection error — using in-memory cache.', err);
      }
      redisAvailable = false;
    });
    
    redis.on('connect', () => {
      redisAvailable = true;
      console.log('[REDIS] ✅ Connected — using Redis for real-time cache.');
    });

    // Try initial connect (won't throw if redis is down)
    try {
      await redis.connect();
    } catch (err) {
      redisAvailable = false;
      logRedisOncePer(10_000, 'warn', '[REDIS] ❌ Initial connect failed — using in-memory fallback cache.', err);
    }
  } catch (err) {
    redisAvailable = false;
    console.warn('[REDIS] ❌ Initialization failed — Using in-memory fallback cache.', err);
  }
};

// Initialize immediately
initRedis();

// ─── In-Memory Fallback ────────────────────────────────────────────────────────

const memoryStore = new Map<string, { data: string; expiresAt: number }>();

// best-effort cleanup so local dev doesn't bloat forever
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of memoryStore.entries()) {
    if (v.expiresAt < now) memoryStore.delete(k);
  }
}, 60_000).unref?.();

function memGet(key: string): string | null {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    memoryStore.delete(key);
    return null;
  }
  return entry.data;
}

function memSet(key: string, value: string, ttlSeconds: number) {
  memoryStore.set(key, { data: value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function memDel(key: string) {
  memoryStore.delete(key);
}

function memKeys(pattern: string): string[] {
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  return Array.from(memoryStore.keys()).filter(k => regex.test(k));
}

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// ─── Unified Cache API ─────────────────────────────────────────────────────────

const MONITOR_STATUS_PREFIX = 'monitor:status:';
const MONITOR_LIST_PREFIX = 'user:monitors:';
const PING_BUFFER_PREFIX = 'ping:buffer:';
const USER_STATS_PREFIX = 'user:stats:';
const AUTH_TOKEN_PREFIX = 'auth:token:';

export const redisCache = {
  // ─── Is Redis available? ───────────────────────────────────────────────────
  isAvailable: () => redisAvailable,

  // ─── Generic get/set ───────────────────────────────────────────────────────
  async get(key: string): Promise<string | null> {
    if (redisAvailable && redis) {
      try { return await redis.get(key); } catch { /* fallback */ }
    }
    return memGet(key);
  },

  async set(key: string, value: string, ttlSeconds: number = 300): Promise<void> {
    if (redisAvailable && redis) {
      try { await redis.setex(key, ttlSeconds, value); return; } catch { /* fallback */ }
    }
    memSet(key, value, ttlSeconds);
  },

  async del(key: string): Promise<void> {
    if (redisAvailable && redis) {
      try { await redis.del(key); return; } catch { /* fallback */ }
    }
    memDel(key);
  },

  // ─── Monitor Status (real-time, set by pinger) ────────────────────────────
  async setMonitorStatus(monitorId: string, status: any): Promise<void> {
    const key = MONITOR_STATUS_PREFIX + monitorId;
    await this.set(key, JSON.stringify(status), 600); // 10 min TTL
  },

  async getMonitorStatus(monitorId: string): Promise<any | null> {
    const key = MONITOR_STATUS_PREFIX + monitorId;
    const data = await this.get(key);
    return data ? safeJsonParse<any>(data) : null;
  },

  // ─── User Monitor List (cached, dashboard reads this) ─────────────────────
  async setUserMonitors(userId: string, monitors: any[]): Promise<void> {
    const key = MONITOR_LIST_PREFIX + userId;
    await this.set(key, JSON.stringify(monitors), 300); // 5 min TTL
  },

  async getUserMonitors(userId: string): Promise<any[] | null> {
    const key = MONITOR_LIST_PREFIX + userId;
    const data = await this.get(key);
    return data ? safeJsonParse<any[]>(data) : null;
  },

  async clearUserMonitors(userId: string): Promise<void> {
    await this.del(MONITOR_LIST_PREFIX + userId);
    await this.del(USER_STATS_PREFIX + userId);
  },

  // ─── User Stats ────────────────────────────────────────────────────────────
  async setUserStats(userId: string, stats: any): Promise<void> {
    const key = USER_STATS_PREFIX + userId;
    await this.set(key, JSON.stringify(stats), 300);
  },

  async getUserStats(userId: string): Promise<any | null> {
    const key = USER_STATS_PREFIX + userId;
    const data = await this.get(key);
    return data ? safeJsonParse<any>(data) : null;
  },

  // ─── Auth Token Cache ─────────────────────────────────────────────────────
  async setAuthUser(token: string, user: any): Promise<void> {
    const key = AUTH_TOKEN_PREFIX + token.slice(-16); // Use last 16 chars as key
    await this.set(key, JSON.stringify(user), 300);
  },

  async getAuthUser(token: string): Promise<any | null> {
    const key = AUTH_TOKEN_PREFIX + token.slice(-16);
    const data = await this.get(key);
    return data ? safeJsonParse<any>(data) : null;
  },

  // ─── Ping Buffer (queues ping results for batch writing to Firestore) ─────
  async pushPingResult(monitorId: string, pingData: any): Promise<void> {
    const key = PING_BUFFER_PREFIX + monitorId;
    const value = JSON.stringify(pingData);
    if (redisAvailable && redis) {
      try {
        await redis.rpush(key, value);
        await redis.expire(key, 600); // 10 min safety TTL
        return;
      } catch { /* fallback */ }
    }
    // In-memory fallback: store as JSON array
    const existing = memGet(key);
    const arr = existing ? (safeJsonParse<any[]>(existing) || []) : [];
    arr.push(pingData);
    memSet(key, JSON.stringify(arr), 600);
  },

  async drainPingBuffer(monitorId: string): Promise<any[]> {
    const key = PING_BUFFER_PREFIX + monitorId;
    if (redisAvailable && redis) {
      try {
        const items = await redis.lrange(key, 0, -1);
        if (items.length > 0) {
          await redis.del(key);
        }
        return items.map(i => JSON.parse(i));
      } catch { /* fallback */ }
    }
    // In-memory fallback
    const existing = memGet(key);
    if (existing) {
      memDel(key);
      return safeJsonParse<any[]>(existing) || [];
    }
    return [];
  },

  // ─── Get all monitor IDs with buffered pings ──────────────────────────────
  async getBufferedMonitorIds(): Promise<string[]> {
    const prefix = PING_BUFFER_PREFIX;
    if (redisAvailable && redis) {
      try {
        const keys = await redis.keys(prefix + '*');
        return keys.map(k => k.replace(prefix, ''));
      } catch { /* fallback */ }
    }
    return memKeys(prefix + '*').map(k => k.replace(prefix, ''));
  },

  // ─── Distributed Locking ──────────────────────────────────────────────────
  async acquireLock(key: string, ttlSeconds: number = 30): Promise<boolean> {
    if (redisAvailable && redis) {
      try {
        const result = await redis.set(key, '1', 'EX', ttlSeconds, 'NX');
        return result === 'OK';
      } catch { /* fallback to memory */ }
    }
    // In-memory simplistic lock
    const existing = memGet(key);
    if (existing) return false;
    memSet(key, '1', ttlSeconds);
    return true;
  },

  async releaseLock(key: string): Promise<void> {
    await this.del(key);
  }
};

export { redis, redisAvailable };
