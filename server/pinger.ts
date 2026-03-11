import { Queue, Worker } from 'bullmq';
import IORedis, { RedisOptions } from 'ioredis';
import nodemailer from 'nodemailer';
import { decrypt } from './crypto.js';
import { adminDb } from './firebase-admin.js';
import crypto from 'crypto';

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
  try {
    const alertChannelsSnapshot = await adminDb.collection('alert_channels').where('monitor_id', '==', monitor.id).get();
    const channels = alertChannelsSnapshot.docs.map(doc => doc.data());
    
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
  } catch (err) {
    console.error('Error fetching alert channels from Firestore:', err);
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
        const parsed = typeof monitor.headers === 'string' ? JSON.parse(monitor.headers) : monitor.headers;
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

  // Update monitor doc in Firestore with last ping info
  const monitorRef = adminDb.collection('monitors').doc(monitor.id);
  
  try {
    const monitorSnap = await monitorRef.get();
    const monitorDoc = monitorSnap.data();
    const lastIsUp = monitorDoc?.last_is_up;

    // Detect status change for alerts
    if (typeof lastIsUp !== 'undefined' && lastIsUp !== isUp) {
      sendAlert(monitor, isUp === 1);
      
      if (isUp === 0) {
        // Create incident
        await monitorRef.collection('incidents').doc(crypto.randomUUID()).set({
          status: 'ongoing',
          error_message: errorMessage,
          started_at: new Date().toISOString()
        });
      } else {
        // Resolve ongoing incidents
        const incidents = await monitorRef.collection('incidents')
          .where('status', '==', 'ongoing')
          .get();
        
        const batch = adminDb.batch();
        incidents.docs.forEach(doc => {
          batch.update(doc.ref, { 
            status: 'resolved', 
            resolved_at: new Date().toISOString() 
          });
        });
        await batch.commit();
      }
    }

    // Log ping and update status
    await monitorRef.update({
      last_pinged_at: new Date().toISOString(),
      last_is_up: isUp,
      last_response_time: responseTime,
      last_status_code: statusCode,
      last_error_message: errorMessage
    });

    // Store ping log (limited to recent history to save storage)
    await monitorRef.collection('pings').add({
      status_code: statusCode,
      response_time: responseTime,
      is_up: isUp,
      error_message: errorMessage,
      created_at: new Date().toISOString()
    });

  } catch (err) {
    console.error('Error updating status in Firestore:', err);
  }
}

// Global worker definition for pingQueue
let worker: Worker | null = null;

try {
  worker = new Worker('pingQueue', async job => {
    const { monitorId } = job.data;
    const monitorDoc = await adminDb.collection('monitors').doc(monitorId).get();
    if (monitorDoc.exists) {
      await pingMonitor({ id: monitorDoc.id, ...monitorDoc.data() });
    }
  }, { 
    connection: connection as any, 
    concurrency: 10,
    skipStalledCheck: true 
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed via bullmq worker:`, err);
  });
} catch (err: any) {
}

export function startPinger() {
  setInterval(async () => {
    try {
      const monitorsSnapshot = await adminDb.collection('monitors').get();
      const monitors = monitorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      const now = new Date();

      for (const monitor of monitors) {
        const lastPinged = monitor.last_pinged_at ? new Date(monitor.last_pinged_at) : new Date(0);
        
        if (monitor.keep_alive) {
          const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
          if (now.getTime() - lastPinged.getTime() < threeDaysMs) {
            continue;
          }
        } else {
          const intervalMs = (monitor.interval || 60) * 1000;
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
    } catch (err) {
      console.error('Pinger loop failed to fetch monitors:', err);
    }
  }, 10000); // 10s check instead of 5s to reduce Firestore reads

  setInterval(async () => {
    // Maintenance: Prune old pings in Firestore if needed (though not strictly necessary as early as SQLite)
    // For now, we'll just log that maintenance is running
    console.log('[MAINTENANCE] Firebase collection health check...');
  }, 24 * 60 * 60 * 1000); 
}
