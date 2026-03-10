import db from './db.js';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import nodemailer from 'nodemailer';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null
};

const connection = new IORedis(redisConfig);
const pingQueue = new Queue('pingQueue', { connection: connection as any });

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
      if (channel.type === 'discord' && channel.destination) {
        await fetch(channel.destination, { 
          method: 'POST', 
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ content: message }) 
        });
      } else if (channel.type === 'slack' && channel.destination) {
        await fetch(channel.destination, { 
          method: 'POST', 
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ text: message }) 
        });
      } else if (channel.type === 'email' && channel.destination) {
        await transporter.sendMail({
          from: '"Uptime Monitor" <alerts@keepalive.example.com>',
          to: channel.destination,
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

  try {
    const url = new URL(monitor.url);
    if (url.hostname === 'localhost' || isPrivateIP(url.hostname)) {
      throw new Error('SSRF protection: Private IPs are not allowed');
    }

    const headers = monitor.headers ? JSON.parse(monitor.headers) : {};
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
  } catch (error) {
    isUp = 0;
  } finally {
    responseTime = Date.now() - startTime;
  }

  // Check if status changed
  const lastPing = db.prepare('SELECT is_up FROM pings WHERE monitor_id = ? ORDER BY created_at DESC LIMIT 1').get(monitor.id) as any;
  if (lastPing && lastPing.is_up !== isUp) {
    sendAlert(monitor, isUp === 1);
    if (isUp === 0) {
      db.prepare('INSERT INTO incidents (id, monitor_id, status) VALUES (?, ?, ?)')
        .run(crypto.randomUUID(), monitor.id, 'ongoing');
    } else {
      db.prepare('UPDATE incidents SET status = ?, resolved_at = CURRENT_TIMESTAMP WHERE monitor_id = ? AND status = ?')
        .run('resolved', monitor.id, 'ongoing');
    }
  }

  db.prepare(`
    INSERT INTO pings (monitor_id, status_code, response_time, is_up)
    VALUES (?, ?, ?, ?)
  `).run(monitor.id, statusCode, responseTime, isUp);

  db.prepare(`
    UPDATE monitors SET last_pinged_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(monitor.id);
}

// Global worker definition for pingQueue
const worker = new Worker('pingQueue', async job => {
  const { monitorId } = job.data;
  const monitor = db.prepare('SELECT * FROM monitors WHERE id = ?').get(monitorId);
  if (monitor) {
    await pingMonitor(monitor);
  }
}, { connection: connection as any, concurrency: 10 });

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed via bullmq worker:`, err);
});

export function startPinger() {
  connection.on('error', (err) => {
    console.warn('[REDIS WARN] Redis connection failed. BullMQ worker suspended. Install Redis or update REDIS_HOST.', err.message);
  });

  // Schedule pings
  setInterval(() => {
    const monitors = db.prepare(`SELECT * FROM monitors`).all();
    const now = new Date();

    for (const monitor of monitors as any[]) {
      const lastPinged = monitor.last_pinged_at ? new Date(monitor.last_pinged_at + 'Z') : new Date(0);
      
      // If Keep Alive, default interval could be 3 days or whatever user set. We respect monitor.interval
      const intervalMs = monitor.interval * 1000;
      
      if (now.getTime() - lastPinged.getTime() >= intervalMs) {
        // Enqueue with 3 retries (BullMQ retry on failure)
        pingQueue.add('ping', { monitorId: monitor.id }, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 }
        }).catch(e => console.error("Redis Add failed:", e));
      }
    }
  }, 5000);

  // Data Retention: Cleanup old pings (older than 14 days) every hour
  setInterval(() => {
    db.prepare(`
      DELETE FROM pings WHERE created_at < datetime('now', '-14 days')
    `).run();
  }, 60 * 60 * 1000);
}
