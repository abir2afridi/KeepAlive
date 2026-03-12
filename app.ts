import express from 'express';
import rateLimit from 'express-rate-limit';
import { startPinger } from './server/pinger.js'; // Old pinger
import { startPingWorker } from './server/queues/ping-queue.js';
import { SchedulerService } from './server/services/scheduler.js';
import { startBatchWriter } from './server/batch-writer.js';
import apiRoutes from './server/api.js';
import authRoutes from './server/auth.js';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const isPortFree = (port: number, host = '0.0.0.0') => new Promise<boolean>((resolve) => {
  const srv = net.createServer();
  srv.once('error', (err: any) => resolve(err?.code !== 'EADDRINUSE'));
  srv.once('listening', () => srv.close(() => resolve(true)));
  srv.listen(port, host);
});

const findFreePort = async (startPort: number, host = '0.0.0.0', maxTries = 20) => {
  for (let i = 0; i < maxTries; i++) {
    const port = startPort + i;
    const free = await isPortFree(port, host);
    if (free) return port;
  }
  throw new Error(`No free port found starting at ${startPort}`);
};

app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});

app.set('trust proxy', 1);
app.use('/api/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

app.use('/api', limiter);
app.use('/auth', limiter);
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const { createServer: createViteServer } = await import('vite');
  const hmrBasePort = parseInt(process.env.VITE_HMR_PORT || '24678');
  let viteHmr: false | { port: number } = false;
  if (process.env.ENABLE_HMR === 'true') {
    const hmrPort = await findFreePort(hmrBasePort);
    if (hmrPort !== hmrBasePort) {
      console.warn(`⚠️ Vite HMR port ${hmrBasePort} is busy, using ${hmrPort} instead.`);
    } else {
      console.log(`✅ Vite HMR port: ${hmrPort}`);
    }
    viteHmr = { port: hmrPort };
  }

  try {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: viteHmr,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (msg.toLowerCase().includes('already in use') || msg.toLowerCase().includes('eaddrinuse')) {
      console.warn('⚠️ Vite middleware failed to start due to a port conflict. Disabling HMR and continuing.');
      const vite = await createViteServer({
        server: { middlewareMode: true, hmr: false },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      console.warn('⚠️ Vite middleware failed to start. Continuing without Vite middleware.', err);
    }
  }
} else {
  // On Vercel, the frontend is served as static files by Vercel platform
  // but we keep this fallback for other environments
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  app.use('/app/*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Only listen if explicitly called (for local dev)
if (!process.env.VERCEL) {
  const INITIAL_PORT = parseInt(process.env.PORT || '3000');
  const port = await findFreePort(INITIAL_PORT);
  if (port !== INITIAL_PORT) {
    console.warn(`⚠️ Port ${INITIAL_PORT} is busy, using ${port} instead.`);
  }

  const startServer = async (desiredPort: number) => {
    const attemptPort = await findFreePort(desiredPort);
    if (attemptPort !== desiredPort) {
      console.warn(`⚠️ Port ${desiredPort} is busy, using ${attemptPort} instead.`);
    }

    const server = app.listen(attemptPort, () => {
      console.log(`\n🚀 Server running on http://localhost:${attemptPort}`);
      console.log(`📡 Background services initializing...\n`);

      // Start background services
      startPingWorker();
      SchedulerService.start();
      startBatchWriter();
    });

    server.on('error', async (err: any) => {
      const msg = String(err?.message || err);
      if (err?.code === 'EADDRINUSE' || msg.toLowerCase().includes('eaddrinuse') || msg.toLowerCase().includes('already in use')) {
        console.warn(`⚠️ Port ${attemptPort} became busy during startup. Retrying on next port...`);
        try { server.close(); } catch {}
        await startServer(attemptPort + 1);
        return;
      }
      console.error('❌ Server failed to start:', err);
    });
  };

  await startServer(port);
}

export default app;
