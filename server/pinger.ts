import { WorkerController } from './controllers/worker-controller.js';
import { SchedulerService } from './services/scheduler.js';
import { redisCache } from './redis-cache.js';

function isPrivateIP(ip: string) {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  if (parts[0] === '10' || parts[0] === '127') return true;
  if (parts[0] === '192' && parts[1] === '168') return true;
  if (parts[0] === '172' && parseInt(parts[1]) >= 16 && parseInt(parts[1]) <= 31) return true;
  if (parts[0] === '169' && parts[1] === '254') return true;
  return false;
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
      } catch (e) {}
    }
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const res = await fetch(monitor.url, {
      method: monitor.method || 'GET',
      headers,
      body: (monitor.method !== 'GET' && monitor.method !== 'HEAD') ? monitor.body : undefined,
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    statusCode = res.status;
    const expected = monitor.expected_status || 200;
    isUp = (res.status === expected) ? 1 : 0;
    if (isUp === 0) errorMessage = `Status ${res.status} (Expected ${expected})`;
  } catch (error: any) {
    isUp = 0;
    errorMessage = error.message || 'Network error';
  } finally {
    responseTime = Date.now() - startTime;
  }

  try {
    // 1. Update REAL-TIME STATUS in Redis (Zero Firestore cost)
    const statusUpdate = {
      id: monitor.id,
      last_is_up: isUp,
      last_response_time: responseTime,
      last_status_code: statusCode,
      last_error_message: errorMessage,
      last_pinged_at: new Date().toISOString()
    };
    
    await redisCache.setMonitorStatus(monitor.id, statusUpdate);

    // 2. Buffer ping result for batch writing (Zero immediate Firestore cost)
    await redisCache.pushPingResult(monitor.id, {
      ...statusUpdate,
      created_at: statusUpdate.last_pinged_at,
      interval_seconds: monitor.interval_seconds || monitor.interval || 60
    });

    // 3. Handle Alerts & Incidents (Only write to Firestore on STATUS CHANGE)
    const lastIsUp = monitor.last_is_up;
    if (typeof lastIsUp !== 'undefined' && lastIsUp !== isUp) {
      console.log(`[STATUS CHANGE] Monitor ${monitor.id} is now ${isUp === 1 ? 'UP' : 'DOWN'}`);
      
      // incidents are handled via WorkerController + Supabase writes
      
      // Clear user cache so dashboard refreshes immediately on status change
      if (monitor.user_id) redisCache.clearUserMonitors(monitor.user_id);
    }
  } catch (err) {
    console.error('[PINGER] Cache update error:', err);
  }
}

export function startPinger() {
  console.log('[PINGER] Old pinger started (Supabase-driven).');
  // Legacy pinger retained for compatibility. The active scheduler is SchedulerService.
  SchedulerService.start();
}
