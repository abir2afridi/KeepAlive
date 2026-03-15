const { createClient } = require('@supabase/supabase-js');

// Environment variables check
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('CRITICAL: Supabase environment variables are missing!');
}

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');
const supabaseAdmin = supabase;

console.log('Supabase initialization status:', {
  hasUrl: !!supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  url: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'none'
});

// Authentication middleware
const verifyAuth = async (req) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    throw new Error('Unauthorized - No token');
  }

  try {
    // Use Supabase auth.getUser() to validate the token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new Error('Invalid token');
    }

    // Get user from database
    const { data: dbUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    console.log('User verified:', { id: user.id, email: user.email, isAdmin: !!dbUser });
    return dbUser || {
      id: user.id,
      email: user.email || '',
      plan: 'free',
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
      status_slug: null
    };
  } catch (error) {
    console.error('Auth verification failed:', error.message);
    throw new Error('Invalid token');
  }
};

module.exports = async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse URL to get pathname properly and remove trailing slashes for robust matching
  const url = new URL(req.url, 'http://localhost');
  let pathname = url.pathname.replace(/\/$/, '') || '/';
  const method = req.method;

  try {
    // Route: GET /api/test
    if (pathname === '/api/test' && method === 'GET') {
      return res.status(200).json({ 
        message: 'API is working!', 
        timestamp: new Date().toISOString(),
        env: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseServiceKey
        }
      });
    }

    // Route: GET /api/auth/debug
    if (pathname === '/api/auth/debug' && method === 'GET') {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(200).json({
          message: 'No token provided',
          hasToken: false,
          headers: req.headers
        });
      }

      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        return res.status(200).json({
          message: 'Token validation result',
          hasToken: true,
          tokenValid: !error && !!user,
          user: user ? {
            id: user.id,
            email: user.email,
            created_at: user.created_at
          } : null,
          error: error?.message
        });
      } catch (err) {
        return res.status(200).json({
          message: 'Token validation failed',
          hasToken: true,
          tokenValid: false,
          error: err.message
        });
      }
    }

    // Route: GET /api/auth/me
    if (pathname === '/api/auth/me' && method === 'GET') {
      const user = await verifyAuth(req);
      return res.status(200).json({ user });
    }

    // Route: POST /api/auth/sync
    if (pathname === '/api/auth/sync' && method === 'POST') {
      try {
        const user = await verifyAuth(req);

        // Sync user data with database
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!existingUser) {
          // Create new user
          const { data: newUser } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email,
              name: user.name || user.email.split('@')[0],
              status_slug: user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-'),
              plan: 'free',
              created_at: new Date().toISOString()
            })
            .select()
            .single();

          return res.status(200).json({ user: newUser });
        } else {
          // Update existing user
          const { data: updatedUser } = await supabase
            .from('users')
            .update({
              email: user.email,
              name: user.name || user.email.split('@')[0],
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
            .select()
            .single();

          return res.status(200).json({ user: updatedUser });
        }
      } catch (error) {
        console.error('Auth sync error:', error);
        return res.status(401).json({
          error: 'Invalid token',
          details: error.message
        });
      }
    }

    // Route: PUT /api/auth/profile
    if (pathname === '/api/auth/profile' && method === 'PUT') {
      const user = await verifyAuth(req);
      const { name, email, status_slug, password } = req.body;

      // Build update fields
      const updateFields = {};
      if (name !== undefined) updateFields.name = name;
      if (email !== undefined) updateFields.email = email;
      if (status_slug !== undefined) updateFields.status_slug = status_slug;

      // Update user profile in DB
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updateFields)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        return res.status(400).json({ error: updateError.message });
      }

      // Update password in Supabase Auth if provided
      if (password) {
        const { error: pwError } = await supabase.auth.admin.updateUserById(user.id, { password });
        if (pwError) {
          return res.status(400).json({ error: 'Profile updated but password change failed: ' + pwError.message });
        }
      }

      return res.status(200).json({ user: updatedUser });
    }

    // Route: GET /api/monitors
    if (pathname === '/api/monitors' && method === 'GET') {
      const user = await verifyAuth(req);

      // Get all active monitors for the user
      const { data: monitors, error: monitorError } = await supabase
        .from('monitors')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log(`Monitors found for user ${user.id}:`, monitors?.length || 0);

      if (monitorError) {
        console.error('Error fetching monitors:', monitorError);
        return res.status(500).json({ error: 'Failed to fetch monitors', details: monitorError.message });
      }

      return res.status(200).json({ monitors: monitors || [] });
    }

    // Route: POST /api/monitors
    if (pathname === '/api/monitors' && method === 'POST') {
      const user = await verifyAuth(req);
      const {
        name,
        url: monitorUrl,
        type,
        interval,
        timeout,
        method: reqMethod,
        body,
        port,
        headers,
        alert_config
      } = req.body;

      const { data: monitor, error: insertError } = await supabase
        .from('monitors')
        .insert({
          user_id: user.id,
          name,
          url: monitorUrl,
          type: type || 'http',
          interval_seconds: interval || 60,
          timeout_seconds: timeout || 30,
          method: reqMethod || 'GET',
          body: body || '',
          port: port || 80,
          headers: headers || '{}',
          alert_config: alert_config || '{}',
          status: 'unknown',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        return res.status(400).json({ error: insertError.message });
      }

      return res.status(201).json({ monitor });
    }

    // Route: GET /api/monitors/:id
    if (pathname.startsWith('/api/monitors/') && method === 'GET') {
      const user = await verifyAuth(req);
      const monitorId = pathname.split('/').pop();

      // Get monitor details
      const { data: monitor } = await supabase
        .from('monitors')
        .select('*')
        .eq('id', monitorId)
        .eq('user_id', user.id)
        .single();

      if (!monitor) {
        return res.status(404).json({ error: 'Monitor not found' });
      }

      // Get recent pings for this monitor
      const { data: pings } = await supabase
        .from('pings')
        .select('*')
        .eq('monitor_id', monitorId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      // Calculate uptime percentage (pings.is_up is boolean)
      const totalPings = pings?.length || 0;
      const successfulPings = pings?.filter(p => p.is_up === true).length || 0;
      const uptimePercent = totalPings > 0 ? (successfulPings / totalPings * 100) : 0;

      // Calculate average response time
      const responseTimes = pings?.filter(p => p.is_up === true && p.response_time).map(p => p.response_time) || [];
      const avgResponseTime = responseTimes.length > 0
        ? (responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
        : 0;

      // Get current status
      const currentPing = pings?.[0];
      const currentIsUp = currentPing?.is_up === true ? 1 : 0;
      const lastResponseTime = currentPing?.response_time || 0;
      const lastErrorMessage = monitor.last_error_message;

      return res.status(200).json({
        ...monitor,
        interval: monitor.interval_seconds,
        uptime_percent: uptimePercent,
        avg_response_time: avgResponseTime,
        current_is_up: currentIsUp,
        last_response_time: lastResponseTime,
        last_error_message: lastErrorMessage,
        recent_pings: pings?.map(ping => ({
          response_time: ping.response_time || 0,
          is_up: ping.is_up === true ? 1 : 0,
          error_message: ping.is_up === false ? (monitor.last_error_message || 'Connection failed') : null,
          created_at: ping.created_at
        })) || []
      });
    }

    // Route: PUT /api/monitors/:id
    if (pathname.startsWith('/api/monitors/') && method === 'PUT') {
      const user = await verifyAuth(req);
      const monitorId = pathname.split('/').pop();
      const {
        name,
        url: monitorUrl,
        type,
        interval,
        timeout,
        method: reqMethod,
        body,
        port,
        headers,
        alert_config
      } = req.body;

      const { data: monitor, error: updateError } = await supabase
        .from('monitors')
        .update({
          name,
          url: monitorUrl,
          type: type || 'http',
          interval_seconds: interval || 60,
          timeout_seconds: timeout || 30,
          method: reqMethod || 'GET',
          body: body || '',
          port: port || 80,
          headers: headers || '{}',
          alert_config: alert_config || '{}'
        })
        .eq('id', monitorId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        return res.status(400).json({ error: updateError.message });
      }

      return res.status(200).json({ monitor });
    }

    // Route: DELETE /api/monitors/:id
    if (pathname.startsWith('/api/monitors/') && method === 'DELETE') {
      const user = await verifyAuth(req);
      const monitorId = pathname.split('/').pop();

      await supabase
        .from('monitors')
        .delete()
        .eq('id', monitorId)
        .eq('user_id', user.id);

      return res.status(204).send();
    }

    // Route: GET /api/stats
    if (pathname === '/api/stats' && method === 'GET') {
      const user = await verifyAuth(req);

      // Get monitor stats - all monitors for user
      const { data: monitors } = await supabase
        .from('monitors')
        .select('id, status')
        .eq('user_id', user.id);

      const totalMonitors = monitors?.length || 0;
      const activeMonitors = totalMonitors;
      const inactiveMonitors = 0;

      // Get ping stats by joining through monitors (pings table has no user_id)
      const monitorIds = monitors?.map(m => m.id) || [];
      let totalPings = 0, successfulPings = 0, failedPings = 0;
      let allResponseTimes = [];

      if (monitorIds.length > 0) {
        const { data: pings } = await supabase
          .from('pings')
          .select('is_up, response_time')
          .in('monitor_id', monitorIds)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        totalPings = pings?.length || 0;
        successfulPings = pings?.filter(p => p.is_up === true).length || 0;
        failedPings = totalPings - successfulPings;
        allResponseTimes = pings?.filter(p => p.is_up === true && p.response_time).map(p => p.response_time) || [];
      }

      const uptime = totalPings > 0 ? (successfulPings / totalPings * 100).toFixed(2) : 0;
      const avgResponseTime = allResponseTimes.length > 0
        ? (allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length).toFixed(2)
        : 0;

      return res.status(200).json({
        total_monitors: totalMonitors,
        overall_uptime: parseFloat(uptime),
        avg_response_time: parseFloat(avgResponseTime),
        stats: {
          monitors: {
            total: totalMonitors,
            active: activeMonitors,
            inactive: inactiveMonitors
          },
          pings: {
            total: totalPings,
            successful: successfulPings,
            failed: failedPings,
            uptime: parseFloat(uptime)
          }
        }
      });
    }

    // Route: GET /api/alerts
    if (pathname === '/api/alerts' && method === 'GET') {
      const user = await verifyAuth(req);

      // Get all alert channels for the user
      const { data: alerts } = await supabase
        .from('alert_channels')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Return flat array (frontend expects Array.isArray(json))
      return res.status(200).json(alerts || []);
    }

    // Route: POST /api/alerts
    if (pathname === '/api/alerts' && method === 'POST') {
      const user = await verifyAuth(req);
      const { monitor_id, type, target, name, config } = req.body;

      if (!monitor_id) {
        return res.status(400).json({ error: 'monitor_id is required' });
      }

      const { data: alert, error: insertError } = await supabase
        .from('alert_channels')
        .insert({
          user_id: user.id,
          monitor_id,
          name: name || `${type} alert`,
          type,
          target: target || '',
          config: config || '{}',
          active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        return res.status(400).json({ error: insertError.message });
      }

      return res.status(201).json(alert);
    }

    // Route: DELETE /api/alerts/:id
    if (pathname.startsWith('/api/alerts/') && method === 'DELETE') {
      const user = await verifyAuth(req);
      const alertId = pathname.split('/').pop();

      const { error: deleteError } = await supabase
        .from('alert_channels')
        .delete()
        .eq('id', alertId)
        .eq('user_id', user.id);

      if (deleteError) {
        return res.status(400).json({ error: deleteError.message });
      }

      return res.status(200).json({ success: true });
    }

    // Route: GET /api/public-status/{slug} or /api/public-status/{slug}/monitors/{id}
    if (pathname.startsWith('/api/public-status/') && method === 'GET') {
      const parts = pathname.split('/').filter(Boolean);
      // Expected parts: ['api', 'public-status', slug] (length 3)
      // Or: ['api', 'public-status', slug, 'monitors', monitorId] (length 5)

      const slug = parts[2];
      const isMonitorDetail = parts.length === 5 && parts[3] === 'monitors';
      const monitorId = isMonitorDetail ? parts[4] : null;

      if (!slug) {
        return res.status(400).json({ error: 'Missing slug parameter' });
      }

      console.log(`Fetching public status for slug: ${slug}, monitorId: ${monitorId || 'none'}`);

      // 1. Try finding by status_pages table
      let { data: statusPage } = await supabaseAdmin
        .from('status_pages')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      let monitorQuery;
      let userData = null;
      let ownerId = null;

      if (statusPage) {
        ownerId = statusPage.user_id;
        const { data: pageUser } = await supabaseAdmin
          .from('users')
          .select('id, email, name, status_slug')
          .eq('id', ownerId)
          .maybeSingle();
        userData = pageUser;
      } else {
        // 2. Fallback: try finding a user with this status_slug
        const { data: slugUser } = await supabaseAdmin
          .from('users')
          .select('id, email, name, status_slug')
          .eq('status_slug', slug)
          .maybeSingle();

        if (!slugUser) {
          console.error(`Public status resolve failed for slug: ${slug}`);
          return res.status(404).json({ error: 'Status page not found' });
        }

        userData = slugUser;
        ownerId = slugUser.id;
        statusPage = {
          slug,
          name: slugUser.name || slugUser.email?.split('@')[0].toUpperCase(),
          public: true
        };
      }

      // Handle Monitor Detail View
      if (isMonitorDetail && monitorId) {
        const { data: monitor } = await supabaseAdmin
          .from('monitors')
          .select('*')
          .eq('id', monitorId)
          .maybeSingle();

        if (!monitor) {
          return res.status(404).json({ error: 'Monitor not found' });
        }

        // Verify monitor belongs to the owner
        if (monitor.user_id !== ownerId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const { data: pings } = await supabaseAdmin
          .from('pings')
          .select('is_up, created_at, response_time, error_message')
          .eq('monitor_id', monitor.id)
          .order('created_at', { ascending: false })
          .limit(100);

        const totalPings = pings?.length || 0;
        const successfulPings = pings?.filter(p => p.is_up === true).length || 0;
        const uptime = totalPings > 0 ? (successfulPings / totalPings * 100).toFixed(2) : 0;

        const responseTimes = pings?.filter(p => p.is_up === true && p.response_time).map(p => p.response_time) || [];
        const avgResponseTime = responseTimes.length > 0
          ? (responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length).toFixed(2)
          : 0;

        const currentPing = pings?.[0];

        return res.status(200).json({
          ...monitor,
          uptime_percent: parseFloat(uptime),
          last_response_time: monitor.last_response_time || (currentPing?.response_time || 0),
          current_is_up: currentPing?.is_up === true ? 1 : 0,
          recent_pings: pings?.map(ping => ({
            response_time: ping.response_time || 0,
            is_up: ping.is_up === true ? 1 : 0,
            created_at: ping.created_at,
            error_message: ping.error_message
          })) || [],
          last_error_message: currentPing?.is_up === false ? currentPing.error_message : null
        });
      }

      // Handle Full Status Page View
      if (ownerId && !monitorQuery) {
        if (statusPage.id) {
          monitorQuery = supabaseAdmin
            .from('monitors')
            .select('*')
            .eq('status_page_id', statusPage.id);
        } else {
          monitorQuery = supabaseAdmin
            .from('monitors')
            .select('*')
            .eq('user_id', ownerId);
        }
      }

      const { data: monitors, error: fetchError } = await monitorQuery.order('name');
      
      if (fetchError) {
        console.error('Status page monitors fetch error:', fetchError);
        return res.status(500).json({ error: 'Failed to fetch status page monitors' });
      }

      // 3. Enrich monitors with ping data
      const monitorsWithPings = await Promise.all(
        (monitors || []).map(async (monitor) => {
          const { data: pings } = await supabaseAdmin
            .from('pings')
            .select('is_up, created_at, response_time')
            .eq('monitor_id', monitor.id)
            .order('created_at', { ascending: false })
            .limit(100);

          const totalPings = pings?.length || 0;
          const successfulPings = pings?.filter(p => p.is_up === true).length || 0;
          const uptime = totalPings > 0 ? (successfulPings / totalPings * 100).toFixed(2) : 0;

          const responseTimes = pings?.filter(p => p.is_up === true && p.response_time).map(p => p.response_time) || [];
          const avgResponseTime = responseTimes.length > 0
            ? (responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length).toFixed(2)
            : 0;

          const currentPing = pings?.[0];
          const currentIsUp = currentPing?.is_up === true ? 1 : 0;

          return {
            ...monitor,
            uptime_percent: parseFloat(uptime),
            avg_response_time: parseFloat(avgResponseTime),
            current_is_up: currentIsUp,
            last_checked: currentPing?.created_at || null,
            recent_pings: pings?.map(ping => ({
              response_time: ping.response_time || 0,
              is_up: ping.is_up === true ? 1 : 0,
              created_at: ping.created_at
            })) || []
          };
        })
      );

      res.setHeader('Cache-Control', 'no-store, max-age=0');
      return res.status(200).json({
        status_page: statusPage,
        user: userData ? {
          email: userData.email,
          name: userData.name
        } : null,
        monitors: monitorsWithPings
      });
    }

    // Default response - this should not be reached for frontend routes
    res.status(404).json({ error: 'API route not found', pathname, method });
  } catch (error) {
    console.error('API Error:', error);
    if (error.message.includes('Unauthorized') || error.message.includes('Invalid token')) {
      return res.status(401).json({
        error: 'Invalid token',
        details: error.message
      });
    }
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};
