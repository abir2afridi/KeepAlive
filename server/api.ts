import { Router } from 'express';
import Stripe from 'stripe';
import { adminDb } from './firebase-admin.js';
import { requireAuth, AuthRequest } from './auth.js';
import { encrypt, decrypt } from './crypto.js';
import crypto from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2025-01-27.acacia' as any
});

const router = Router();

// Public route for status page
router.get('/public-status/:slug', async (req, res) => {
  const { slug } = req.params;
  
  try {
    const userSnapshot = await adminDb.collection('users').where('status_slug', '==', slug).limit(1).get();
    
    if (userSnapshot.empty) {
      return res.status(404).json({ error: 'Status page not found' });
    }

    const userData = userSnapshot.docs[0].data();
    const userId = userSnapshot.docs[0].id;

    const monitorsSnapshot = await adminDb.collection('monitors').where('user_id', '==', userId).get();
    const monitors = monitorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

    const monitorsWithStats = await Promise.all(monitors.map(async (m: any) => {
      // Data is now already in Firestore
      const monitorRef = adminDb.collection('monitors').doc(m.id);
      
      const [pingsSnap, incidentsSnap] = await Promise.all([
        monitorRef.collection('pings').orderBy('created_at', 'desc').limit(50).get(),
        monitorRef.collection('incidents').orderBy('started_at', 'desc').limit(5).get()
      ]);

      const pings = pingsSnap.docs.map(doc => doc.data()).reverse();
      const incidents = incidentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate simple uptime from these 50 pings
      const upCount = pings.filter((p: any) => p.is_up === 1).length;
      const uptimePercent = pings.length > 0 ? (upCount * 100) / pings.length : 100;
      const avgResponseTime = pings.length > 0 
        ? pings.reduce((acc: number, p: any) => acc + p.response_time, 0) / pings.length 
        : 0;

      const alertsSnapshot = await adminDb.collection('alert_channels').where('monitor_id', '==', m.id).get();
      const alertMap: any = { email: false, discord: false, slack: false, telegram: false };
      alertsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        alertMap[data.type] = true;
        if (data.type !== 'email') alertMap[`${data.type}_url`] = decrypt(data.destination);
      });

      return { 
        ...m, 
        current_is_up: m.last_is_up,
        last_checked: m.last_pinged_at,
        last_response_time: m.last_response_time,
        last_error_message: m.last_error_message,
        uptime_percent: uptimePercent,
        avg_response_time: Math.round(avgResponseTime),
        recent_pings: pings,
        recent_incidents: incidents,
        alert_config: JSON.stringify(alertMap)
      };
    }));

    res.json({ 
      user: { email: userData.email, slug: userData.status_slug },
      monitors: monitorsWithStats 
    });
  } catch (error) {
    console.error('Public status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/public-status/:slug/monitors/:monitorId', async (req, res) => {
  const { slug, monitorId } = req.params;
  
  try {
    const userSnapshot = await adminDb.collection('users').where('status_slug', '==', slug).limit(1).get();
    if (userSnapshot.empty) return res.status(404).json({ error: 'Status page not found' });
    
    const userId = userSnapshot.docs[0].id;
    const monitorDoc = await adminDb.collection('monitors').doc(monitorId).get();
    
    if (!monitorDoc.exists || monitorDoc.data()?.user_id !== userId) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    const m = { id: monitorDoc.id, ...monitorDoc.data() } as any;

    const monitorRef = adminDb.collection('monitors').doc(monitorId);
    const pingsSnap = await monitorRef.collection('pings').orderBy('created_at', 'desc').limit(100).get();
    const pings = pingsSnap.docs.map(doc => doc.data()).reverse();

    const upCount = pings.filter((p: any) => p.is_up === 1).length;
    const uptimePercent = pings.length > 0 ? (upCount * 100) / pings.length : 100;
    const avgResponseTime = pings.length > 0 
      ? pings.reduce((acc: number, p: any) => acc + p.response_time, 0) / pings.length 
      : 0;

    res.json({ 
      ...m, 
      current_is_up: m.last_is_up,
      last_response_time: m.last_response_time,
      last_error_message: m.last_error_message,
      last_checked: m.last_pinged_at,
      uptime_percent: uptimePercent,
      avg_response_time: Math.round(avgResponseTime),
      recent_pings: pings 
    });
  } catch (error) {
    console.error('Public monitor details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.use(requireAuth);

router.get('/monitors', async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const monitorsSnapshot = await adminDb.collection('monitors').where('user_id', '==', userId).get();
    const monitors = monitorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

    const monitorsWithPings = await Promise.all(monitors.map(async (m: any) => {
      const monitorRef = adminDb.collection('monitors').doc(m.id);
      const pingsSnap = await monitorRef.collection('pings').orderBy('created_at', 'desc').limit(20).get();
      const pings = pingsSnap.docs.map(doc => doc.data()).reverse();

      const upCount = pings.filter((p: any) => p.is_up === 1).length;
      const uptimePercent = pings.length > 0 ? (upCount * 100) / pings.length : 100;

      const alertsSnapshot = await adminDb.collection('alert_channels').where('monitor_id', '==', m.id).get();
      const alertMap: any = { email: false, discord: false, slack: false, telegram: false };
      alertsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        alertMap[data.type] = true;
        if (data.type !== 'email') alertMap[`${data.type}_url`] = decrypt(data.destination);
      });

      return { 
        ...m, 
        current_is_up: m.last_is_up,
        last_response_time: m.last_response_time,
        last_error_message: m.last_error_message,
        uptime_percent: uptimePercent,
        recent_pings: pings,
        alert_config: JSON.stringify(alertMap)
      };
    }));

    res.json(monitorsWithPings);
  } catch (error) {
    console.error('List monitors error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/monitors/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const monitorDoc = await adminDb.collection('monitors').doc(id).get();
    if (!monitorDoc.exists || monitorDoc.data()?.user_id !== userId) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    const monitor = { id: monitorDoc.id, ...monitorDoc.data() } as any;

    const monitorRef = adminDb.collection('monitors').doc(id);
    const pingsSnap = await monitorRef.collection('pings').orderBy('created_at', 'desc').limit(50).get();
    const pings = pingsSnap.docs.map(doc => doc.data()).reverse();

    const upCount = pings.filter((p: any) => p.is_up === 1).length;
    const uptimePercent = pings.length > 0 ? (upCount * 100) / pings.length : 100;

    const alertsSnapshot = await adminDb.collection('alert_channels').where('monitor_id', '==', id).get();
    const alertMap: any = { email: false, discord: false, slack: false, telegram: false };
    alertsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      alertMap[data.type] = true;
      if (data.type !== 'email') alertMap[`${data.type}_url`] = decrypt(data.destination);
    });

    res.json({ 
      ...monitor, 
      current_is_up: monitor.last_is_up,
      last_response_time: monitor.last_response_time,
      last_error_message: monitor.last_error_message,
      uptime_percent: uptimePercent,
      recent_pings: pings,
      alert_config: JSON.stringify(alertMap)
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/monitors', async (req: AuthRequest, res) => {
  const { name, url, type, interval, method, headers, body, keep_alive, expected_status, alerts: bodyAlerts, alert_config } = req.body;
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  // Handle alert_config from frontend
  let alerts = bodyAlerts;
  if (!alerts && alert_config) {
    try {
      alerts = typeof alert_config === 'string' ? JSON.parse(alert_config) : alert_config;
    } catch (e) {
      alerts = null;
    }
  }

  try {
    const monitorData = {
      user_id: userId,
      name,
      url,
      type,
      interval,
      method,
      headers: JSON.stringify(headers),
      body,
      keep_alive: keep_alive ? 1 : 0,
      expected_status: expected_status || 200,
      created_at: new Date().toISOString()
    };

    const docRef = await adminDb.collection('monitors').add(monitorData);
    const id = docRef.id;

    // Save alert channels
    if (alerts) {
      const alertCollection = adminDb.collection('alert_channels');
      if (alerts.email) {
        await alertCollection.add({ monitor_id: id, type: 'email', destination: encrypt(req.user?.email || '') });
      }
      if (alerts.discord && alerts.discord_url) {
        await alertCollection.add({ monitor_id: id, type: 'discord', destination: encrypt(alerts.discord_url) });
      }
      if (alerts.slack && alerts.slack_url) {
        await alertCollection.add({ monitor_id: id, type: 'slack', destination: encrypt(alerts.slack_url) });
      }
      if (alerts.telegram && alerts.telegram_url) {
        await alertCollection.add({ monitor_id: id, type: 'telegram', destination: encrypt(alerts.telegram_url) });
      }
    }

    // Trigger initial ping asynchronously
    import('./pinger.js').then(({ pingMonitor }) => pingMonitor({ id, ...monitorData }));
    
    res.json({ id, success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/monitors/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, url, type, interval, method, headers, body, keep_alive, expected_status, alerts: bodyAlerts, alert_config } = req.body;
  const userId = req.user?.id;

  // Handle alert_config from frontend
  let alerts = bodyAlerts;
  if (!alerts && alert_config) {
    try {
      alerts = typeof alert_config === 'string' ? JSON.parse(alert_config) : alert_config;
    } catch (e) {
      alerts = null;
    }
  }

  try {
    const monitorDoc = await adminDb.collection('monitors').doc(id).get();
    if (!monitorDoc.exists || monitorDoc.data()?.user_id !== userId) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    const updateData = {
      name, url, type, interval, method, 
      headers: JSON.stringify(headers), 
      body, 
      keep_alive: keep_alive ? 1 : 0, 
      expected_status: expected_status || 200
    };

    await adminDb.collection('monitors').doc(id).update(updateData);

    if (alerts) {
      // Delete old alerts and add new ones (Firestore way)
      const oldAlerts = await adminDb.collection('alert_channels').where('monitor_id', '==', id).get();
      const batch = adminDb.batch();
      oldAlerts.docs.forEach(doc => batch.delete(doc.ref));
      
      const alertCollection = adminDb.collection('alert_channels');
      if (alerts.email) {
        const ref = alertCollection.doc();
        batch.set(ref, { monitor_id: id, type: 'email', destination: encrypt(req.user?.email || '') });
      }
      if (alerts.discord && alerts.discord_url) {
        const ref = alertCollection.doc();
        batch.set(ref, { monitor_id: id, type: 'discord', destination: encrypt(alerts.discord_url) });
      }
      if (alerts.slack && alerts.slack_url) {
        const ref = alertCollection.doc();
        batch.set(ref, { monitor_id: id, type: 'slack', destination: encrypt(alerts.slack_url) });
      }
      if (alerts.telegram && alerts.telegram_url) {
        const ref = alertCollection.doc();
        batch.set(ref, { monitor_id: id, type: 'telegram', destination: encrypt(alerts.telegram_url) });
      }
      await batch.commit();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/monitors/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const monitorDoc = await adminDb.collection('monitors').doc(id).get();
    if (!monitorDoc.exists || monitorDoc.data()?.user_id !== userId) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    await adminDb.collection('monitors').doc(id).delete();
    // Also delete alert channels
    const alerts = await adminDb.collection('alert_channels').where('monitor_id', '==', id).get();
    const batch = adminDb.batch();
    alerts.forEach(doc => batch.delete(doc.ref));
    
    // Note: In Firestore, deleting a document doesn't delete sub-collections automatically.
    // However, for simplicity here we focus on the top-level delete. 
    // Usually a Cloud Function or a batch delete utility would handle pings/incidents.
    
    await batch.commit();

    res.json({ success: true });
  } catch (error) {
    console.error('Delete monitor error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/stats', async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const monitorsSnapshot = await adminDb.collection('monitors').where('user_id', '==', userId).get();
    const monitorIds = monitorsSnapshot.docs.map(doc => doc.id);

    if (monitorIds.length === 0) {
      return res.json({ total_monitors: 0, overall_uptime: 0, avg_response_time: 0 });
    }

    // Aggregate stats from Firestore
    let totalUptimeSum = 0;
    let totalRTsum = 0;
    let count = 0;

    for (const monitorId of monitorIds) {
      const monitorDoc = await adminDb.collection('monitors').doc(monitorId).get();
      const data = monitorDoc.data();
      if (data) {
        // Use normalized stats if available
        if (typeof data.last_is_up !== 'undefined') {
           totalUptimeSum += (data.last_is_up === 1 ? 100 : 0);
           totalRTsum += (data.last_response_time || 0);
           count++;
        }
      }
    }

    res.json({
      total_monitors: monitorIds.length,
      overall_uptime: count > 0 ? totalUptimeSum / count : 0,
      avg_response_time: count > 0 ? Math.round(totalRTsum / count) : 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
