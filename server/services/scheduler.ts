import { pingQueue } from '../queues/ping-queue.js';
import { WorkerController } from '../controllers/worker-controller.js';
import { MonitorRegistry } from './supabase-monitor-registry.ts';
import { redisCache } from '../redis-cache.js';
import type { Monitor } from '../types/monitor.js';

export class SchedulerService {
  static async start() {
    console.log('[SCHEDULER] Monitor scheduler started.');

    // Start background registry refresh (60s)
    MonitorRegistry.start();

    // Run every 10 seconds to check what's due
    setInterval(async () => {
      try {
        const now = Date.now();

        const monitors = MonitorRegistry.getAll();
        if (monitors.length === 0) {
          return;
        }

        // Queue due monitors
        for (const monitor of monitors) {
          const lastPing = new Date(monitor.last_pinged_at || 0).getTime();
          const intervalMs = (monitor.interval_seconds || 60) * 1000;

          if (now - lastPing >= intervalMs) {
            // Distributed lock to prevent double-queuing from multiple instances
            const lockKey = `lock:ping:${monitor.id}`;
            const acquired = await redisCache.acquireLock(lockKey, Math.min(30, monitor.interval_seconds || 30));
            
            if (!acquired) {
              // Someone elsewhere is already processing this monitor or just queued it
              continue;
            }

            const m = monitor as unknown as Monitor;
            if (pingQueue) {
              // Add to BullMQ
              await pingQueue.add(`ping:${monitor.id}`, 
                { monitor: m }, 
                { jobId: `ping:${monitor.id}:${Math.floor(now / (Math.max(1, monitor.interval_seconds || 60) * 1000))}` }
              ).catch(err => {
                console.warn('[SCHEDULER] Failed to add to queue, processing directly:', err.message);
                WorkerController.processPing(m);
              });
            } else {
              // Fallback: Process directly if Redis/Queue is down
              WorkerController.processPing(m);
            }

            // Optimistically update local cache to prevent re-queuing in this same loop
            MonitorRegistry.touchLastPingedAt(monitor.id, new Date().toISOString());
          }
        }
      } catch (err) {
        console.error('[SCHEDULER] Loop error:', err);
      }
    }, 10000);
  }
}
