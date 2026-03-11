import express from 'express';
import { createServer as createViteServer } from 'vite';
import rateLimit from 'express-rate-limit';
import db from './server/db.js';
import { startPinger } from './server/pinger.js';
import apiRoutes from './server/api.js';
import authRoutes from './server/auth.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust the first proxy (e.g., nginx) to correctly populate req.ip
  app.set('trust proxy', 1);

  app.use('/api/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json());

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased limit for better usability
    standardHeaders: true,
    legacyHeaders: false,
    validate: {
      xForwardedForHeader: false,
    },
  });
  app.use('/api', limiter);
  app.use('/auth', limiter);

  // Auth routes
  app.use('/auth', authRoutes);

  // API routes
  app.use('/api', apiRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.use('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    startPinger();
  });
}

startServer();
