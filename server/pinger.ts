import db from './db.js';
import { Queue, Worker } from 'bullmq';
import IORedis, { RedisOptions } from 'ioredis';
import nodemailer from 'nodemailer';
import { decrypt } from './crypto.js';

const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
  retryStrategy: () => null // Stop it from infinitely trying to reconnect if down
};

const connection = new IORedis(redisConfig);

let redisWarningShown = false;
connection.on('error', (err) => {
  if (!redisWarningShown) {
    console.warn('[REDIS INFO] Redis not detected. Falling back to direct pinging (Standalone Mode).');
    redisWarningShown = true;
  }
});

connection.on('connect', () => {
  console.log('[REDIS OK] Connected to Redis. BullMQ worker active.');
  redisWarningShown = false;
});

// Fix type mismatch by casting to any for the BullMQ connection
const pingQueue = new Queue('pingQueue', { 
  connection: connection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 }
  }
});

// Nodemailer setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER || 'mock_user',
    pass: process.env.SMTP_PASS || 'mock_pass'
  }
});

function isPrivateIP(ip: string) {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  if (parts[0] === '10' || parts[0] === '127') return true;
  if (parts[0] === '192' && parts[1] === '168') return true;
  if (parts[0] === '172' && parseInt(parts[1]) >= 16 && parseInt(parts[1]) <= 31) return true;
  if (parts[0] === '169' && parts[1] === '254') return true;
  return false;
}

async function sendAlert(monitor: any, isUp: boolean) {
  const channels = db.prepare('SELECT * FROM alert_channels WHERE monitor_id = ?').all(monitor.id);
  const status = isUp ? 'UP' : 'DOWN';
  const message = `[${status}] Monitor ${monitor.name} (${monitor.url}) is now ${status}.`;
  
  for (const channel of channels as any[]) {
    console.log(`[ALERT] Sending ${channel.type} alert to ${channel.destination}: ${message}`);
    
    try {
      const destination = decrypt(channel.destination);
      if (channel.type === 'discord' && destination) {
        await fetch(destination, { 
          method: 'POST', 
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ content: message }) 
        });
      } else if (channel.type === 'slack' && destination) {
        await fetch(destination, { 
          method: 'POST', 
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ text: message }) 
        });
      } else if (channel.type === 'telegram' && destination) {
        // Expecting destination to be a full Telegram Bot API URL or we construct it
        // Assuming user provides the full URL for simplicity in this setup
        await fetch(destination, { method: 'POST' });
      } else if (channel.type === 'email' && destination) {
        await transporter.sendMail({
          from: '"Uptime Monitor" <alerts@keepalive.example.com>',
          to: destination,
          subject: message,
          text: message
        });
      }
    } catch (e) {
      console.error(`Failed to send ${channel.type} alert:`, e);
    }
  }
}

export async function pingMonitor(monitor: any) {
  const startTime = Date.now();
  let isUp = 0;
  let statusCode: number | null = null;
  let responseTime = 0;
  let errorMessage: string | null = null;

  try {
    const url = new URL(monitor.url);
    if (url.hostname === 'localhost' || isPrivateIP(url.hostname)) {
      throw new Error('SSRF protection: Private IPs are not allowed');
    }

    let headers: Record<string, string> = {};
    if (monitor.headers) {
      try {
        const parsed = JSON.parse(monitor.headers);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          for (const [k, v] of Object.entries(parsed)) {
            headers[k] = String(v);
          }
        }
      } catch (e) { console.error('Error parsing headers for monitor', monitor.id); }
    }
    const options: RequestInit = {
      method: monitor.method,
      headers,
    };
    
    if (monitor.method !== 'GET' && monitor.method !== 'HEAD' && monitor.body) {
      options.body = monitor.body;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    options.signal = controller.signal;

    const res = await fetch(monitor.url, options);
    clearTimeout(timeout);

    statusCode = res.status;
    const expected = monitor.expected_status || 200;
    isUp = (res.status === expected) ? 1 : 0;
    if (isUp === 0) {
      errorMessage = `Unexpected status code: ${res.status} (Expected: ${expected})`;
    }
  } catch (error: any) {
    isUp = 0;
    errorMessage = error.message || 'Unknown network error';
    if (error.status) statusCode = error.status;
  } finally {
    responseTime = Date.now() - startTime;
  }

  // Check if status changed
  const lastPing = db.prepare('SELECT is_up FROM pings WHERE monitor_id = ? ORDER BY created_at DESC LIMIT 1').get(monitor.id) as any;
  if (lastPing && lastPing.is_up !== isUp) {
    sendAlert(monitor, isUp === 1);
    if (isUp === 0) {
      db.prepare('INSERT INTO incidents (id, monitor_id, status, error_message) VALUES (?, ?, ?, ?)')
        .run(crypto.randomUUID(), monitor.id, 'ongoing', errorMessage);
    } else {
      db.prepare('UPDATE incidents SET status = ?, resolved_at = CURRENT_TIMESTAMP WHERE monitor_id = ? AND status = ?')
        .run('resolved', monitor.id, 'ongoing');
    }
  }

  db.prepare(`
    INSERT INTO pings (monitor_id, status_code, response_time, is_up, error_message)
    VALUES (?, ?, ?, ?, ?)
  `).run(monitor.id, statusCode, responseTime, isUp, errorMessage);

  db.prepare(`
    UPDATE monitors SET last_pinged_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(monitor.id);
}

// Global worker definition for pingQueue
let worker: Worker | null = null;

try {
  worker = new Worker('pingQueue', async job => {
    const { monitorId } = job.data;
    const monitor = db.prepare('SELECT * FROM monitors WHERE id = ?').get(monitorId);
    if (monitor) {
      await pingMonitor(monitor);
    }
  }, { 
    connection: connection as any, 
    concurrency: 10,
    // Don't start processing if Redis isn't up
    skipStalledCheck: true 
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed via bullmq worker:`, err);
  });
} catch (err: any) {
  // Silent catch: worker relies on Redis. If it fails to instantiate, Standalone mode takes over.
}

async function aggregateData() {
  console.log('[AGGREGATE] Running hourly and daily data aggregation...');
  
  // 1. Hourly Aggregation (last hour)
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString().slice(0, 13) + ':00:00';
  const monitors = db.prepare('SELECT id FROM monitors').all() as any[];

  for (const monitor of monitors) {
    const stats = db.prepare(`
      SELECT 
        AVG(response_time) as avg_rt,
        COUNT(CASE WHEN is_up = 1 THEN 1 END) * 100.0 / COUNT(*) as uptime,
        COUNT(*) as cnt
      FROM pings
      WHERE monitor_id = ? AND created_at LIKE ?
    `).get(monitor.id, `${hourAgo.slice(0, 13)}%`) as any;

    if (stats && stats.cnt > 0) {
      db.prepare(`
        INSERT OR REPLACE INTO ping_aggregates_hourly (monitor_id, hour, avg_response_time, uptime_percent, ping_count)
        VALUES (?, ?, ?, ?, ?)
      `).run(monitor.id, hourAgo, Math.round(stats.avg_rt), stats.uptime, stats.cnt);
    }
  }

  // 2. Daily Aggregation (last day)
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  for (const monitor of monitors) {
    const dailyStats = db.prepare(`
      SELECT 
        AVG(avg_response_time) as avg_rt,
        AVG(uptime_percent) as uptime,
        SUM(ping_count) as cnt
      FROM ping_aggregates_hourly
      WHERE monitor_id = ? AND hour LIKE ?
    `).get(monitor.id, `${dayAgo}%`) as any;

    if (dailyStats && dailyStats.cnt > 0) {
      db.prepare(`
        INSERT OR REPLACE INTO ping_aggregates_daily (monitor_id, day, avg_response_time, uptime_percent, ping_count)
        VALUES (?, ?, ?, ?, ?)
      `).run(monitor.id, dayAgo, Math.round(dailyStats.avg_rt), dailyStats.uptime, dailyStats.cnt);
    }
  }
}

export function startPinger() {
  // Schedule pings
  setInterval(async () => {
    const monitors = db.prepare(`SELECT * FROM monitors`).all();
    const now = new Date();

    for (const monitor of monitors as any[]) {
      const lastPinged = monitor.last_pinged_at ? new Date(monitor.last_pinged_at + 'Z') : new Date(0);
      
      // Handle Supabase Keep-Alive (ping every 3 days)
      if (monitor.keep_alive) {
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
        if (now.getTime() - lastPinged.getTime() < threeDaysMs) {
          continue; // Skip if it's too soon for keep-alive
        }
      } else {
        // Normal monitor interval
        const intervalMs = monitor.interval * 1000;
        if (now.getTime() - lastPinged.getTime() < intervalMs) {
          continue;
        }
      }

      if (connection.status === 'ready') {
        pingQueue.add('ping', { monitorId: monitor.id }).catch(() => pingMonitor(monitor));
      } else {
        await pingMonitor(monitor);
      }
    }
  }, 5000);

  // Periodic Tasks
  setInterval(() => {
    // 1. Data Retention: Cleanup old pings (older than 14 days)
    db.prepare(`DELETE FROM pings WHERE created_at < datetime('now', '-14 days')`).run();
    
    // 2. Cleanup hourly aggregates (older than 3 months)
    db.prepare(`DELETE FROM ping_aggregates_hourly WHERE hour < datetime('now', '-90 days')`).run();
    
    // 3. Daily aggregation run (every hour to catch up)
    aggregateData().catch(e => console.error('Aggregation failed:', e));

  }, 60 * 60 * 1000); 
}
