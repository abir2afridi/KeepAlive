import { Queue, Worker, Job } from 'bullmq';
import { WorkerController } from '../controllers/worker-controller.js';
import { redis, redisAvailable } from '../redis-cache.js';

export let pingQueue: Queue | null = null;

try {
  if (redisAvailable && redis) {
    pingQueue = new Queue('ping-tasks', {
      connection: redis as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
      }
    });
  } else {
    pingQueue = null;
    console.warn('[QUEUE] Redis not available, queue disabled (scheduler will run direct pings).');
  }
} catch (e) {
  pingQueue = null;
  console.warn('[QUEUE] Redis queue init failed, queue disabled (scheduler will run direct pings).');
}

export const startPingWorker = () => {
  try {
    if (!(redisAvailable && redis)) {
      console.warn('[WORKER] Redis not available, worker disabled (scheduler will run direct pings).');
      return;
    }
    const worker = new Worker('ping-tasks', async (job: Job) => {
      const { monitor } = job.data;
      console.log(`[WORKER] Processing ping for: ${monitor.name} (${monitor.id})`);
      await WorkerController.processPing(monitor);
    }, {
      connection: redis as any,
      concurrency: 50,
    });

    worker.on('error', (err) => {
      // Prevent crash on connection errors
    });

    worker.on('failed', (job, err) => {
      console.error(`[WORKER] Job ${job?.id} failed:`, err);
    });

    console.log('[WORKER] Ping worker initialized.');
  } catch (e) {
    console.warn('[WORKER] Worker init failed, worker disabled (scheduler will run direct pings).');
  }
};
