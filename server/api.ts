import { Router } from 'express';
import Stripe from 'stripe';
import db from './db.js';
import { requireAuth, AuthRequest } from './auth.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2025-01-27.acacia' as any
});

const router = Router();

// Public route for status page
router.get('/public-status/:slug', (req, res) => {
  const { slug } = req.params;
  const user = db.prepare('SELECT id FROM users WHERE status_slug = ?').get(slug) as any;
  
  if (!user) {
    return res.status(404).json({ error: 'Status page not found' });
  }

  const monitors = db.prepare(`
    SELECT m.id, m.name, m.url, m.type,
      (SELECT is_up FROM pings p WHERE p.monitor_id = m.id ORDER BY created_at DESC LIMIT 1) as current_is_up,
      (SELECT COUNT(*) FROM pings p WHERE p.monitor_id = m.id AND p.is_up = 1) * 100.0 / NULLIF((SELECT COUNT(*) FROM pings p WHERE p.monitor_id = m.id), 0) as uptime_percent
    FROM monitors m
    WHERE m.user_id = ?
    ORDER BY m.created_at DESC
  `).all(user.id);

  const monitorsWithPings = monitors.map((m: any) => {
    const pings = db.prepare(`
      SELECT response_time, is_up, created_at 
      FROM pings 
      WHERE monitor_id = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all(m.id).reverse();
    return { ...m, recent_pings: pings };
  });

  res.json({ monitors: monitorsWithPings });
});

router.use(requireAuth);

// Billing Endpoints
router.post('/checkout-session', async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const email = req.user?.email;
  
  if (!process.env.STRIPE_SECRET_KEY) {
    // Mock upgrade flow if no stripe key
    db.prepare("UPDATE users SET plan = 'pro' WHERE id = ?").run(userId);
    return res.json({ url: '/settings?success=true' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Pro Cluster Subscription',
              description: '50 Monitors, 1-minute intervals, SMS & Webhook alerts',
            },
            unit_amount: 1200, // $12.00
            recurring: { interval: 'month' }
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/settings?success=true`,
      cancel_url: `${req.headers.origin}/settings?canceled=true`,
      client_reference_id: userId
    });
    
    res.json({ url: session.url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/verify-checkout', (req: AuthRequest, res) => {
  const userId = req.user?.id;
  // In production, sync status with Stripe logic/webhooks. Mocking verification here:
  db.prepare("UPDATE users SET plan = 'pro' WHERE id = ?").run(userId);
  res.json({ success: true, plan: 'pro' });
});

router.get('/monitors', (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const monitors = db.prepare(`
    SELECT m.*, 
      (SELECT is_up FROM pings p WHERE p.monitor_id = m.id ORDER BY created_at DESC LIMIT 1) as current_is_up,
      (SELECT response_time FROM pings p WHERE p.monitor_id = m.id ORDER BY created_at DESC LIMIT 1) as last_response_time,
      (SELECT COUNT(*) FROM pings p WHERE p.monitor_id = m.id AND p.is_up = 1) * 100.0 / NULLIF((SELECT COUNT(*) FROM pings p WHERE p.monitor_id = m.id), 0) as uptime_percent
    FROM monitors m
    WHERE m.user_id = ?
    ORDER BY m.created_at DESC
  `).all(userId);

  // Get last 10 pings for sparkline
  const monitorsWithPings = monitors.map((m: any) => {
    const pings = db.prepare(`
      SELECT response_time, is_up, created_at 
      FROM pings 
      WHERE monitor_id = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all(m.id).reverse();
    return { ...m, recent_pings: pings };
  });

  res.json(monitorsWithPings);
});

router.post('/monitors', (req: AuthRequest, res) => {
  const { name, url, type, interval, method, headers, body, keep_alive, expected_status, alerts } = req.body;
  const id = crypto.randomUUID();
  const userId = req.user?.id;
  
  const stmt = db.prepare(`
    INSERT INTO monitors (id, user_id, name, url, type, interval, method, headers, body, keep_alive, expected_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, userId, name, url, type, interval, method, JSON.stringify(headers), body, keep_alive ? 1 : 0, expected_status || 200);
  
  // Save alert channels
  if (alerts) {
    const insertAlert = db.prepare(`
      INSERT INTO alert_channels (id, monitor_id, type, destination)
      VALUES (?, ?, ?, ?)
    `);
    
    if (alerts.email) {
      // Actually, we could use a custom email if provided, but let's stick to user email for simple UI
      insertAlert.run(crypto.randomUUID(), id, 'email', req.user?.email || '');
    }
    if (alerts.discord && alerts.discord_url) {
      insertAlert.run(crypto.randomUUID(), id, 'discord', alerts.discord_url);
    }
    if (alerts.slack && alerts.slack_url) {
      insertAlert.run(crypto.randomUUID(), id, 'slack', alerts.slack_url);
    }
  }

  // Trigger initial ping asynchronously
  const monitor = db.prepare('SELECT * FROM monitors WHERE id = ?').get(id);
  if (monitor) {
    import('./pinger.js').then(({ pingMonitor }) => pingMonitor(monitor));
  }
  
  res.json({ id, success: true });
});

router.put('/monitors/:id', (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, url, type, interval, method, headers, body, keep_alive, expected_status } = req.body;
  const userId = req.user?.id;

  const stmt = db.prepare(`
    UPDATE monitors 
    SET name=?, url=?, type=?, interval=?, method=?, headers=?, body=?, keep_alive=?, expected_status=?
    WHERE id=? AND user_id=?
  `);
  
  const result = stmt.run(name, url, type, interval, method, JSON.stringify(headers), body, keep_alive ? 1 : 0, expected_status || 200, id, userId);
  
  // Re-save alert channels
  const alerts = req.body.alerts;
  if (alerts) {
    db.prepare('DELETE FROM alert_channels WHERE monitor_id = ?').run(id);
    const insertAlert = db.prepare('INSERT INTO alert_channels (id, monitor_id, type, destination) VALUES (?, ?, ?, ?)');
    if (alerts.email) insertAlert.run(crypto.randomUUID(), id, 'email', req.user?.email || '');
    if (alerts.discord && alerts.discord_url) insertAlert.run(crypto.randomUUID(), id, 'discord', alerts.discord_url);
    if (alerts.slack && alerts.slack_url) insertAlert.run(crypto.randomUUID(), id, 'slack', alerts.slack_url);
  }
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Monitor not found or unauthorized' });
  }

  res.json({ success: true });
});

router.delete('/monitors/:id', (req: AuthRequest, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const result = db.prepare('DELETE FROM monitors WHERE id = ? AND user_id = ?').run(id, userId);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Monitor not found or unauthorized' });
  }

  res.json({ success: true });
});

router.get('/stats', (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const totalMonitors = db.prepare('SELECT COUNT(*) as count FROM monitors WHERE user_id = ?').get(userId) as { count: number };
  
  const uptime = db.prepare(`
    SELECT 
      COUNT(CASE WHEN p.is_up = 1 THEN 1 END) * 100.0 / NULLIF(COUNT(p.id), 0) as overall_uptime,
      AVG(p.response_time) as avg_response_time
    FROM pings p
    JOIN monitors m ON p.monitor_id = m.id
    WHERE m.user_id = ?
  `).get(userId) as { overall_uptime: number, avg_response_time: number };

  res.json({
    total_monitors: totalMonitors.count,
    overall_uptime: uptime.overall_uptime || 0,
    avg_response_time: uptime.avg_response_time || 0
  });
});

export default router;
