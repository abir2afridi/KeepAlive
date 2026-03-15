import { Router } from 'express';
import Stripe from 'stripe';
import { requireAuth, AuthRequest } from './auth.js';
import { encrypt, decrypt } from './crypto.js';
import crypto from 'crypto';
import { supabaseAdmin } from './supabase/server-client.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2025-01-27.acacia' as any
});

import { redisCache } from './redis-cache.js';

const router = Router();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withBackoff<T>(fn: () => Promise<T>, opts?: { label?: string; maxRetries?: number; baseDelayMs?: number }) {
  const label = opts?.label || 'op';
  const maxRetries = opts?.maxRetries ?? 4;
  const baseDelayMs = opts?.baseDelayMs ?? 250;

  let lastErr: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e: any) {
      lastErr = e;
      const delay = Math.min(5000, baseDelayMs * Math.pow(2, attempt));
      console.warn(`[API] ${label} failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delay}ms`);
      await sleep(delay);
    }
  }
  throw lastErr;
}

async function runQuery<T>(fn: () => Promise<T>, opts?: { label?: string; maxRetries?: number; baseDelayMs?: number }): Promise<T> {
  return withBackoff(fn, opts);
}

async function ensureDefaultProjectIdForUser(userId: string): Promise<string | null> {
  try {
    const { data: existing } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existing?.id) return existing.id;

    const slug = String(userId).replace(/-/g, '').slice(0, 12);
    const { data: inserted, error } = await supabaseAdmin
      .from('projects')
      .insert({ user_id: userId, name: 'Default Project', slug })
      .select('id')
      .single();
    if (error) throw error;
    return inserted?.id || null;
  } catch (e) {
    console.warn('[API] ensureDefaultProjectIdForUser failed:', e);
    return null;
  }
}

const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    next(err);
  });
};

// Helper for standardized error responses
const sendError = (res: any, error: any, message: string = 'Internal Server Error', code: number = 500) => {
  console.error(`[API ERROR] ${message}:`, error);
  const details = process.env.NODE_ENV === 'development'
    ? (error?.message || String(error))
    : undefined;
  return res.status(code).json({
    error: message,
    details,
    timestamp: new Date().toISOString()
  });
};

router.use((req, _res, next) => {
  // lightweight request context for debugging
  (req as any).requestId = (req as any).requestId || crypto.randomUUID?.() || String(Date.now());
  next();
});

// ─── Public Status Endpoints (no auth) ──────────────────────────────────────

router.get('/public-status/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;
  try {
    // 1. Find user by slug
    const { data: userRow, error: uErr } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('status_slug', slug)
      .maybeSingle();
    if (uErr || !userRow) return res.status(404).json({ error: 'Status page not found' });
    const userId = userRow.id;

    // 2. Fetch monitors for this user
    let monitors = await redisCache.getUserMonitors(userId);
    if (!monitors) {
      const { data, error } = await supabaseAdmin
        .from('monitors')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      monitors = data || [];
    }

    const monitorIds = (monitors || []).map((m: any) => m.id);
    let pingRows: any[] = [];
    if (monitorIds.length > 0) {
      const { data: pingsData, error: pErr } = await supabaseAdmin
        .from('pings')
        .select('monitor_id, response_time, is_up, created_at')
        .in('monitor_id', monitorIds)
        .order('created_at', { ascending: false })
        .limit(1500);
      if (!pErr) pingRows = pingsData || [];
    }

    const pingsByMonitor = new Map<string, any[]>();
    for (const p of pingRows) {
      const arr = pingsByMonitor.get(p.monitor_id) || [];
      if (arr.length < 60) arr.push(p);
      pingsByMonitor.set(p.monitor_id, arr);
    }

    // 3. Merge live status + attach recent pings + compute aggregates
    const enriched = await Promise.all((monitors || []).map(async (m: any) => {
      const recentDesc = pingsByMonitor.get(m.id) || [];
      const recent_pings = [...recentDesc].reverse();

      const upCount = recent_pings.filter((p: any) => p.is_up === true || p.is_up === 1).length;
      const uptime_percent = recent_pings.length > 0 ? (upCount * 100) / recent_pings.length : 100;

      const avg_response_time = recent_pings.length > 0
        ? Math.round(recent_pings.reduce((acc: number, p: any) => acc + (p.response_time || 0), 0) / recent_pings.length)
        : (m.last_response_time || 0);

      let current_is_up = m.last_is_up ?? 1;
      let last_checked = m.last_pinged_at ?? null;
      let last_error_message = m.last_error_message ?? undefined;

      try {
        const live = await redisCache.getMonitorStatus(m.id);
        if (live) {
          current_is_up = live.last_is_up;
          last_checked = live.last_pinged_at;
          last_error_message = live.last_error_message;
        }
      } catch {
        // ignore live failures
      }

      return {
        id: m.id,
        name: m.name,
        url: m.url,
        type: m.type,
        current_is_up: current_is_up === true ? 1 : current_is_up === false ? 0 : (current_is_up ?? 1),
        uptime_percent,
        avg_response_time,
        last_error_message,
        last_checked,
        recent_pings: recent_pings.map((p: any) => ({
          response_time: p.response_time,
          is_up: p.is_up === true ? 1 : p.is_up === false ? 0 : p.is_up,
          created_at: p.created_at,
        })),
        recent_incidents: [],
      };
    }));

    res.json({
      site_name: userRow.name || 'Uptime Status',
      user: { id: userRow.id, email: userRow.email, name: userRow.name, status_slug: userRow.status_slug },
      monitors: enriched
    });
  } catch (error) {
    return sendError(res, error, 'Failed to fetch public status');
  }
}));

router.get('/public-status/:slug/monitors/:id', asyncHandler(async (req, res) => {
  const { slug, id } = req.params;
  try {
    const { data: userRow, error: uErr } = await supabaseAdmin
      .from('users')
      .select('id, email, name, status_slug')
      .eq('status_slug', slug)
      .maybeSingle();
    if (uErr || !userRow) return res.status(404).json({ error: 'Status page not found' });

    const { data: monitorRow, error: mErr } = await supabaseAdmin
      .from('monitors')
      .select('*')
      .eq('id', id)
      .eq('user_id', userRow.id)
      .maybeSingle();
    if (mErr || !monitorRow) return res.status(404).json({ error: 'Monitor not found' });

    const { data: pingRows, error: pErr } = await supabaseAdmin
      .from('ping_logs')
      .select('response_time, is_up, created_at')
      .eq('monitor_id', id)
      .order('created_at', { ascending: false })
      .limit(60);
    if (pErr) throw pErr;
    const recent_pings = (pingRows || []).reverse().map((p: any) => ({
      response_time: p.response_time,
      is_up: p.is_up === true ? 1 : p.is_up === false ? 0 : p.is_up,
      created_at: p.created_at,
    }));

    const { data: incidentRows, error: iErr } = await supabaseAdmin
      .from('incidents')
      .select('started_at, resolved_at, status, reason, created_at')
      .eq('monitor_id', id)
      .order('started_at', { ascending: false })
      .limit(10);
    if (iErr) {
      // best-effort
    }

    let liveStatus: any = null;
    try { liveStatus = await redisCache.getMonitorStatus(id); } catch {}

    res.json({
      ...monitorRow,
      current_is_up: liveStatus ? liveStatus.last_is_up : (monitorRow.last_is_up ?? 1),
      last_response_time: liveStatus ? liveStatus.last_response_time : monitorRow.last_response_time,
      last_error_message: liveStatus ? liveStatus.last_error_message : monitorRow.last_error_message,
      last_pinged_at: liveStatus ? liveStatus.last_pinged_at : monitorRow.last_pinged_at,
      recent_pings,
      recent_incidents: (incidentRows || []).map((r: any) => ({
        created_at: r.started_at || r.created_at,
        error_message: r.reason,
        is_up: r.status === 'resolved' ? 1 : 0,
        response_time: null,
      })),
    });
  } catch (error) {
    return sendError(res, error, 'Failed to fetch public monitor');
  }
}));

router.use(requireAuth);

// ─── Projects ───────────────────────────────────────────────────────────────

router.get('/projects', asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const result: any = await runQuery(
      () => supabaseAdmin
        .from('projects')
        .select('id, name, slug, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }) as any,
      { label: 'list projects' }
    );
    if (result?.error) throw result.error;
    res.json(result?.data || []);
  } catch (error) {
    return sendError(res, error, 'Failed to fetch projects');
  }
}));

router.post('/projects', asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { name, slug } = req.body || {};
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Missing project name' });
  }

  try {
    const payload: any = { user_id: userId, name: String(name).trim() };
    if (slug && typeof slug === 'string') payload.slug = slug;
    const result: any = await runQuery(
      () => supabaseAdmin.from('projects').insert(payload).select('id, name, slug, created_at').single() as any,
      { label: 'create project' }
    );
    if (result?.error) throw result.error;
    res.json({ success: true, project: result?.data });
  } catch (error) {
    return sendError(res, error, 'Failed to create project');
  }
}));

// ─── Alerts (alert_channels) ────────────────────────────────────────────────

router.get('/alerts', asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const monitorId = typeof req.query.monitor_id === 'string' ? req.query.monitor_id : undefined;

  try {
    let query = supabaseAdmin
      .from('alert_channels')
      .select('id, monitor_id, type, target, created_at')
      .order('created_at', { ascending: false });

    if (monitorId) {
      const { data: mon, error: mErr } = await supabaseAdmin
        .from('monitors')
        .select('id')
        .eq('id', monitorId)
        .eq('user_id', userId)
        .single();
      if (mErr || !mon) return res.status(404).json({ error: 'Monitor not found' });
      query = query.eq('monitor_id', monitorId);
    } else {
      const { data: mons, error: monsErr } = await supabaseAdmin
        .from('monitors')
        .select('id')
        .eq('user_id', userId);
      if (monsErr) throw monsErr;
      const ids = (mons || []).map((m: any) => m.id);
      if (ids.length === 0) return res.json([]);
      query = query.in('monitor_id', ids);
    }

    const result: any = await runQuery(() => query as any, { label: 'list alert_channels' });
    if (result?.error) throw result.error;

    const rows = (result?.data || []).map((r: any) => ({
      ...r,
      target: r.type === 'email' ? r.target : (() => {
        try { return decrypt(r.target); } catch { return null; }
      })(),
    }));

    res.json(rows);
  } catch (error) {
    return sendError(res, error, 'Failed to fetch alerts');
  }
}));

router.post('/alerts', asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { monitor_id, type, target } = req.body || {};
  if (!monitor_id || !type || !target) {
    return res.status(400).json({ error: 'Missing fields: monitor_id, type, target' });
  }

  try {
    const { data: mon, error: mErr } = await supabaseAdmin
      .from('monitors')
      .select('id')
      .eq('id', monitor_id)
      .eq('user_id', userId)
      .single();
    if (mErr || !mon) return res.status(404).json({ error: 'Monitor not found' });

    const row = {
      monitor_id,
      type,
      target: type === 'email' ? String(target) : encrypt(String(target)),
    };

    const result: any = await runQuery(
      () => supabaseAdmin.from('alert_channels').insert(row).select('id, monitor_id, type, target, created_at').single() as any,
      { label: 'create alert_channel' }
    );
    if (result?.error) throw result.error;
    await redisCache.del(`alerts:${monitor_id}`);
    res.json({ success: true, alert: result?.data });
  } catch (error) {
    return sendError(res, error, 'Failed to create alert');
  }
}));

router.delete('/alerts/:id', asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.params;

  try {
    const { data: row, error: rErr } = await supabaseAdmin
      .from('alert_channels')
      .select('id, monitor_id')
      .eq('id', id)
      .maybeSingle();
    if (rErr || !row) return res.status(404).json({ error: 'Alert not found' });

    const { data: mon, error: mErr } = await supabaseAdmin
      .from('monitors')
      .select('id')
      .eq('id', row.monitor_id)
      .eq('user_id', userId)
      .single();
    if (mErr || !mon) return res.status(403).json({ error: 'Unauthorized' });

    const result: any = await runQuery(
      () => supabaseAdmin.from('alert_channels').delete().eq('id', id) as any,
      { label: 'delete alert_channel' }
    );
    if (result?.error) throw result.error;
    await redisCache.del(`alerts:${row.monitor_id}`);
    res.json({ success: true });
  } catch (error) {
    return sendError(res, error, 'Failed to delete alert');
  }
}));

router.get('/monitors', asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const projectId = typeof req.query.project_id === 'string' ? req.query.project_id : undefined;

  try {
    // 1. Check cache first
    let monitors: any[] | null = null;
    try {
      monitors = await redisCache.getUserMonitors(userId);
    } catch (cacheErr) {
      console.warn('[API] Redis read failed, falling back to Firestore:', cacheErr);
    }

    if (!monitors) {
      let monQuery = supabaseAdmin
        .from('monitors')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (projectId) {
        monQuery = monQuery.eq('project_id', projectId);
      }

      const monResult: any = await runQuery(() => monQuery as any, { label: 'list monitors' });
      if (monResult?.error) throw monResult.error;
      const rawMonitors = monResult?.data;

      const ids = (rawMonitors || []).map((m: any) => m.id);
      let pingRows: any[] = [];
      let alertRows: any[] = [];

      if (ids.length > 0) {
        const { data: pingsData, error: pErr } = await supabaseAdmin
          .from('pings')
          .select('*')
          .in('monitor_id', ids)
          .order('created_at', { ascending: false })
          .limit(200);
        if (!pErr) pingRows = pingsData || [];

        const { data: alertsData, error: aErr } = await supabaseAdmin
          .from('alert_channels')
          .select('*')
          .in('monitor_id', ids);
        if (!aErr) alertRows = alertsData || [];
      }

      const pingsByMonitor = new Map<string, any[]>();
      for (const p of pingRows) {
        const arr = pingsByMonitor.get(p.monitor_id) || [];
        if (arr.length < 10) arr.push(p);
        pingsByMonitor.set(p.monitor_id, arr);
      }

      const alertsByMonitor = new Map<string, any[]>();
      for (const a of alertRows) {
        const arr = alertsByMonitor.get(a.monitor_id) || [];
        arr.push(a);
        alertsByMonitor.set(a.monitor_id, arr);
      }

      monitors = (rawMonitors || []).map((m: any) => {
        const recentDesc = pingsByMonitor.get(m.id) || [];
        const pings = [...recentDesc].reverse();
        const upCount = pings.filter((p: any) => p.is_up === true || p.is_up === 1).length;
        const uptimePercent = pings.length > 0 ? (upCount * 100) / pings.length : 100;

        const alertMap: any = { email: false, webhook: false, telegram: false };
        const monitorAlerts = alertsByMonitor.get(m.id) || [];
        for (const a of monitorAlerts) {
          alertMap[a.type] = true;
          if (a.type !== 'email' && a.target) {
            try {
              alertMap[`${a.type}_url`] = decrypt(a.target);
            } catch {
              // ignore decrypt issues
            }
          }
        }

        return {
          ...m,
          uptime_percent: uptimePercent,
          recent_pings: pings,
          alert_config: JSON.stringify(alertMap),
        };
      });

      // Store in Redis (async, don't block response)
      redisCache.setUserMonitors(userId, monitors).catch(e => console.error('[API] Cache set failed:', e));
    }

    // 3. MERGE REAL-TIME DATA from Redis status
    const monitorsWithLiveStatus = await Promise.all(monitors.map(async (m: any) => {
      try {
        const liveStatus = await redisCache.getMonitorStatus(m.id);
        if (liveStatus) {
          const recentPings = Array.isArray(m.recent_pings) ? m.recent_pings : [];
          return {
            ...m,
            current_is_up: liveStatus.last_is_up,
            last_response_time: liveStatus.last_response_time,
            last_error_message: liveStatus.last_error_message,
            last_pinged_at: liveStatus.last_pinged_at,
            recent_pings: [...recentPings.slice(1), {
              is_up: liveStatus.last_is_up,
              response_time: liveStatus.last_response_time,
              created_at: liveStatus.last_pinged_at
            }]
          };
        }
      } catch (liveErr) {
        console.warn(`[API] Live status merge failed for ${m.id}:`, liveErr);
      }
      return { ...m, current_is_up: m.last_is_up ?? 1 };
    }));

    res.json(monitorsWithLiveStatus);
  } catch (error: any) {
    return sendError(res, error, 'Failed to fetch monitors');
  }
}));

router.get('/stats', asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    let stats: any = null;
    try {
      stats = await redisCache.getUserStats(userId);
    } catch (cacheErr) {
      console.warn('[API] Stats cache read failed');
    }
    
    if (stats) return res.json(stats);

    // If no stats in cache, recalculate
    let monitors: any[] | null = null;
    try {
      monitors = await redisCache.getUserMonitors(userId);
    } catch (e) {}

    if (!monitors) {
      const { data, error } = await supabaseAdmin
        .from('monitors')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      monitors = data || [];
    }

    let totalUptimeSum = 0;
    let totalRTsum = 0;
    let count = 0;

    for (const m of (monitors || [])) {
      try {
        const live = await redisCache.getMonitorStatus(m.id);
        const isUp = live ? live.last_is_up : m.last_is_up;
        const rt = live ? live.last_response_time : m.last_response_time;

        if (typeof isUp !== 'undefined' && isUp !== null) {
          totalUptimeSum += (isUp === 1 ? 100 : 0);
          totalRTsum += (rt || 0);
          count++;
        }
      } catch (err) {
        console.warn(`[API] Error computing stats for monitor ${m.id}`);
      }
    }

    const finalStats = {
      total_monitors: monitors?.length || 0,
      overall_uptime: count > 0 ? Math.round(totalUptimeSum / count) : 100,
      avg_response_time: count > 0 ? Math.round(totalRTsum / count) : 0
    };

    redisCache.setUserStats(userId, finalStats).catch(() => {});
    res.json(finalStats);
  } catch (error: any) {
    return sendError(res, error, 'Failed to fetch statistics');
  }
}));

router.get('/pings', asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const monitorId = typeof req.query.monitor_id === 'string' ? req.query.monitor_id : undefined;
  const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit || '50')) || 50));

  try {
    let query = supabaseAdmin
      .from('ping_logs')
      .select('id, monitor_id, status_code, response_time, is_up, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (monitorId) {
      // ensure monitor belongs to user
      const { data: mon, error: mErr } = await supabaseAdmin
        .from('monitors')
        .select('id')
        .eq('id', monitorId)
        .eq('user_id', userId)
        .single();
      if (mErr || !mon) return res.status(404).json({ error: 'Monitor not found' });

      query = query.eq('monitor_id', monitorId);
    } else {
      // get pings for user monitors
      const { data: mons, error: monsErr } = await supabaseAdmin
        .from('monitors')
        .select('id')
        .eq('user_id', userId);
      if (monsErr) throw monsErr;
      const ids = (mons || []).map((m: any) => m.id);
      if (ids.length === 0) return res.json([]);
      query = query.in('monitor_id', ids);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    return sendError(res, error, 'Failed to fetch pings');
  }
}));

// Update /monitors POST, PUT, DELETE to clear redisCache
router.post('/monitors', asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { name, url, type, interval, method, body, headers, expected_status, alert_config, keep_alive } = req.body;
  
  try {
    const intervalSeconds = parseInt(interval) || 300;

    const project_id = await ensureDefaultProjectIdForUser(userId!);

    const monitorData: any = {
      user_id: userId,
      project_id,
      name,
      url,
      type: type || 'http',
      interval_seconds: intervalSeconds,
      status: 'unknown',
    };

    const { data: inserted, error } = await supabaseAdmin
      .from('monitors')
      .insert(monitorData)
      .select('*')
      .single();
    if (error) throw error;

    if (alert_config) {
      let config: any = null;
      try { config = typeof alert_config === 'string' ? JSON.parse(alert_config) : alert_config; } catch { config = null; }
      if (config) {
        const channels = [
          { type: 'email', target: req.user?.email, active: !!config.email },
          { type: 'webhook', target: config.webhook_url || config.discord_url || config.slack_url, active: !!(config.webhook || config.discord || config.slack) },
          { type: 'telegram', target: config.telegram_url, active: !!config.telegram },
        ];

        const rows = channels
          .filter((c) => c.active && c.target)
          .map((c) => ({
            monitor_id: inserted.id,
            type: c.type,
            target: c.type === 'email' ? c.target : encrypt(String(c.target)),
          }));

        if (rows.length > 0) {
          await supabaseAdmin.from('alert_channels').insert(rows);
        }
      }
    }

    await redisCache.clearUserMonitors(userId!);
    res.json({ id: inserted.id, success: true });
  } catch (error) {
    return sendError(res, error, 'Failed to create monitor');
  }
}));

router.get('/monitors/:id', asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { id } = req.params;

  try {
    const { data: monitorRow, error } = await supabaseAdmin
      .from('monitors')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (error || !monitorRow) return res.status(404).json({ error: 'Monitor not found' });

    let monitor = { ...monitorRow } as any;

    const liveStatus = await redisCache.getMonitorStatus(id);
    if (liveStatus) {
      monitor = {
        ...monitor,
        current_is_up: liveStatus.last_is_up,
        last_response_time: liveStatus.last_response_time,
        last_error_message: liveStatus.last_error_message,
        last_pinged_at: liveStatus.last_pinged_at
      };
    } else {
      monitor.current_is_up = monitor.last_is_up;
    }

    res.json(monitor);
  } catch (error) {
    return sendError(res, error, 'Failed to fetch monitor');
  }
}));

router.put('/monitors/:id', asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { id } = req.params;
  const { name, url, type, interval, method, body, headers, expected_status, alert_config, keep_alive } = req.body;

  try {
    const { data: existing, error: exErr } = await supabaseAdmin
      .from('monitors')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (exErr || !existing) return res.status(403).json({ error: 'Unauthorized' });

    const patch: any = {};
    if (name !== undefined) patch.name = name;
    if (url !== undefined) patch.url = url;
    if (type !== undefined) patch.type = type;
    if (interval !== undefined) patch.interval_seconds = parseInt(interval) || 300;

    // ensure project_id is always set (default)
    const project_id = await ensureDefaultProjectIdForUser(userId!);
    if (project_id) patch.project_id = project_id;

    const { error } = await supabaseAdmin
      .from('monitors')
      .update(patch)
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;

    if (alert_config) {
      let config: any = null;
      try { config = typeof alert_config === 'string' ? JSON.parse(alert_config) : alert_config; } catch { config = null; }
      if (config) {
        await supabaseAdmin.from('alert_channels').delete().eq('monitor_id', id);

        const channels = [
          { type: 'email', target: req.user?.email, active: !!config.email },
          { type: 'webhook', target: config.webhook_url || config.discord_url || config.slack_url, active: !!(config.webhook || config.discord || config.slack) },
          { type: 'telegram', target: config.telegram_url, active: !!config.telegram },
        ];

        const rows = channels
          .filter((c) => c.active && c.target)
          .map((c) => ({
            monitor_id: id,
            type: c.type,
            target: c.type === 'email' ? c.target : encrypt(String(c.target)),
          }));

        if (rows.length > 0) {
          await supabaseAdmin.from('alert_channels').insert(rows);
        }
      }
    }

    await redisCache.clearUserMonitors(userId!);
    await redisCache.del(`alerts:${id}`);
    
    res.json({ success: true });
  } catch (error) {
    return sendError(res, error, 'Failed to update monitor');
  }
}));

router.delete('/monitors/:id', asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { id } = req.params;

  try {
    const { data: existing, error: exErr } = await supabaseAdmin
      .from('monitors')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (exErr || !existing) return res.status(403).json({ error: 'Unauthorized' });

    await supabaseAdmin.from('alert_channels').delete().eq('monitor_id', id);
    await supabaseAdmin.from('ping_logs').delete().eq('monitor_id', id);
    const { error } = await supabaseAdmin.from('monitors').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
    await redisCache.clearUserMonitors(userId!);
    await redisCache.del(`alerts:${id}`);
    await redisCache.del(`monitor:status:${id}`);
    
    res.json({ success: true });
  } catch (error) {
    return sendError(res, error, 'Failed to delete monitor');
  }
}));

// Public Status Page
router.get('/public-status/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;
  try {
    // 1. Find user by slug
    const { data: userRow, error: uErr } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('status_slug', slug)
      .maybeSingle();
    if (uErr || !userRow) return res.status(404).json({ error: 'Status page not found' });
    const userId = userRow.id;

    // 2. Fetch monitors for this user
    let monitors = await redisCache.getUserMonitors(userId);
    if (!monitors) {
      const { data, error } = await supabaseAdmin
        .from('monitors')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      monitors = data || [];
    }

    const monitorIds = (monitors || []).map((m: any) => m.id);
    let pingRows: any[] = [];
    if (monitorIds.length > 0) {
      const { data: pingsData, error: pErr } = await supabaseAdmin
        .from('ping_logs')
        .select('monitor_id, response_time, is_up, created_at')
        .in('monitor_id', monitorIds)
        .order('created_at', { ascending: false })
        .limit(1500);
      if (!pErr) pingRows = pingsData || [];
    }

    const pingsByMonitor = new Map<string, any[]>();
    for (const p of pingRows) {
      const arr = pingsByMonitor.get(p.monitor_id) || [];
      if (arr.length < 60) arr.push(p);
      pingsByMonitor.set(p.monitor_id, arr);
    }

    // 3. Merge live status + attach recent pings + compute aggregates
    const enriched = await Promise.all((monitors || []).map(async (m: any) => {
      const recentDesc = pingsByMonitor.get(m.id) || [];
      const recent_pings = [...recentDesc].reverse();

      const upCount = recent_pings.filter((p: any) => p.is_up === true || p.is_up === 1).length;
      const uptime_percent = recent_pings.length > 0 ? (upCount * 100) / recent_pings.length : 100;

      const avg_response_time = recent_pings.length > 0
        ? Math.round(recent_pings.reduce((acc: number, p: any) => acc + (p.response_time || 0), 0) / recent_pings.length)
        : (m.last_response_time || 0);

      let current_is_up = m.last_is_up ?? 1;
      let last_checked = m.last_pinged_at ?? null;
      let last_error_message = m.last_error_message ?? undefined;

      try {
        const live = await redisCache.getMonitorStatus(m.id);
        if (live) {
          current_is_up = live.last_is_up;
          last_checked = live.last_pinged_at;
          last_error_message = live.last_error_message;
        }
      } catch {
        // ignore live failures
      }

      return {
        id: m.id,
        name: m.name,
        url: m.url,
        type: m.type,
        current_is_up: current_is_up === true ? 1 : current_is_up === false ? 0 : (current_is_up ?? 1),
        uptime_percent,
        avg_response_time,
        last_error_message,
        last_checked,
        recent_pings: recent_pings.map((p: any) => ({
          response_time: p.response_time,
          is_up: p.is_up === true ? 1 : p.is_up === false ? 0 : p.is_up,
          created_at: p.created_at,
        })),
        recent_incidents: [],
      };
    }));

    res.json({
      site_name: userRow.name || 'Uptime Status',
      user: { id: userRow.id, email: userRow.email, name: userRow.name, status_slug: userRow.status_slug },
      monitors: enriched
    });
  } catch (error) {
    return sendError(res, error, 'Failed to fetch public status');
  }
}));

router.use((err: any, _req: any, res: any, _next: any) => {
  if (res.headersSent) return;
  return sendError(res, err, 'Unhandled API error');
});

export default router;
