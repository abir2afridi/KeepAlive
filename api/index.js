const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    return dbUser || { 
      id: user.id, 
      email: user.email || '', 
      plan: 'free',
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
      status_slug: null
    };
  } catch (error) {
    console.error('Auth error:', error);
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

  // Parse URL to get pathname properly
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;
  const method = req.method;

  try {
    // Route: GET /api/test
    if (pathname === '/api/test' && method === 'GET') {
      return res.status(200).json({ message: 'API is working!', timestamp: new Date().toISOString() });
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
      const { name, email } = req.body;

      // Update user profile
      const { data: updatedUser } = await supabase
        .from('users')
        .update({
          name: name || user.name,
          email: email || user.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      return res.status(200).json({ user: updatedUser });
    }

    // Route: GET /api/monitors
    if (pathname === '/api/monitors' && method === 'GET') {
      const user = await verifyAuth(req);

      // Get all active monitors for the user
      const { data: monitors } = await supabase
        .from('monitors')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active') // ✅ Only return active monitors
        .order('created_at', { ascending: false });

      return res.status(200).json({ monitors });
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
        method,
        body,
        port,
        headers,
        alert_config
      } = req.body;

      const { data: monitor } = await supabase
        .from('monitors')
        .insert({
          user_id: user.id,
          name,
          url: monitorUrl,
          type: type || 'http',
          interval: interval || 60,
          timeout: timeout || 30,
          method: method || 'GET',
          body: body || '',
          port: port || 80,
          headers: headers || '{}',
          alert_config: alert_config || '{}',
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

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
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order('created_at', { ascending: false })
        .limit(100);

      // Calculate uptime percentage
      const totalPings = pings?.length || 0;
      const successfulPings = pings?.filter(p => p.status === 'success').length || 0;
      const uptimePercent = totalPings > 0 ? (successfulPings / totalPings * 100) : 0;

      // Calculate average response time
      const responseTimes = pings?.filter(p => p.status === 'success' && p.response_time).map(p => p.response_time) || [];
      const avgResponseTime = responseTimes.length > 0 
        ? (responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
        : 0;

      // Get current status
      const currentPing = pings?.[0];
      const currentIsUp = currentPing?.status === 'success' ? 1 : 0;
      const lastResponseTime = currentPing?.response_time || 0;
      const lastErrorMessage = currentPing?.error_message;

      return res.status(200).json({
        ...monitor,
        uptime_percent: uptimePercent,
        avg_response_time: avgResponseTime,
        current_is_up: currentIsUp,
        last_response_time: lastResponseTime,
        last_error_message: lastErrorMessage,
        recent_pings: pings?.map(ping => ({
          response_time: ping.response_time,
          is_up: ping.status === 'success' ? 1 : 0,
          error_message: ping.error_message,
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
        method,
        body,
        port,
        headers,
        alert_config
      } = req.body;

      const { data: monitor } = await supabase
        .from('monitors')
        .update({
          name,
          url: monitorUrl,
          type: type || 'http',
          interval: interval || 60,
          timeout: timeout || 30,
          method: method || 'GET',
          body: body || '',
          port: port || 80,
          headers: headers || '{}',
          alert_config: alert_config || '{}',
          updated_at: new Date().toISOString()
        })
        .eq('id', monitorId)
        .eq('user_id', user.id)
        .select()
        .single();

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

      // Get monitor stats - only active monitors
      const { data: monitors } = await supabase
        .from('monitors')
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'active'); // ✅ Only count active monitors

      const totalMonitors = monitors?.length || 0;
      const activeMonitors = monitors?.filter(m => m.status === 'active').length || 0;
      const inactiveMonitors = totalMonitors - activeMonitors;

      // Get ping stats (simplified)
      const { data: pings } = await supabase
        .from('pings')
        .select('status, response_time')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

      const totalPings = pings?.length || 0;
      const successfulPings = pings?.filter(p => p.status === 'success').length || 0;
      const failedPings = totalPings - successfulPings;
      const uptime = totalPings > 0 ? (successfulPings / totalPings * 100).toFixed(2) : 0;

      // Calculate average response time
      const responseTimes = pings?.filter(p => p.status === 'success' && p.response_time).map(p => p.response_time) || [];
      const avgResponseTime = responseTimes.length > 0 
        ? (responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length).toFixed(2)
        : 0;

      return res.status(200).json({
        total_monitors: totalMonitors,
        overall_uptime: parseFloat(uptime),
        avg_response_time: parseFloat(avgResponseTime),
        // Also include the detailed structure for compatibility
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

      return res.status(200).json({ alerts });
    }

    // Route: POST /api/alerts
    if (pathname === '/api/alerts' && method === 'POST') {
      const user = await verifyAuth(req);
      const { name, type, config } = req.body;

      const { data: alert } = await supabase
        .from('alert_channels')
        .insert({
          user_id: user.id,
          name,
          type,
          config,
          active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      return res.status(201).json({ alert });
    }

    // Route: GET /api/public-status/{slug}
    if (pathname.startsWith('/api/public-status/') && method === 'GET') {
      const slug = pathname.split('/').pop();

      if (!slug) {
        return res.status(400).json({ error: 'Missing slug parameter' });
      }

      // Get public status page by slug
      const { data: statusPage } = await supabase
        .from('public_status_pages')
        .select('*')
        .eq('slug', slug)
        .eq('public', true)
        .single();

      if (!statusPage) {
        return res.status(404).json({ error: 'Status page not found' });
      }

      // Get monitors for this status page
      const { data: monitors } = await supabase
        .from('monitors')
        .select('*')
        .eq('status_page_id', statusPage.id)
        .order('name');

      // Get recent pings for each monitor
      const monitorsWithPings = await Promise.all(
        monitors?.map(async (monitor) => {
          const { data: pings } = await supabase
            .from('pings')
            .select('status, created_at, response_time')
            .eq('monitor_id', monitor.id)
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
            .order('created_at', { ascending: false })
            .limit(100);

          const totalPings = pings?.length || 0;
          const successfulPings = pings?.filter(p => p.status === 'success').length || 0;
          const uptime = totalPings > 0 ? (successfulPings / totalPings * 100).toFixed(2) : 0;

          // Calculate average response time
          const responseTimes = pings?.filter(p => p.status === 'success' && p.response_time).map(p => p.response_time) || [];
          const avgResponseTime = responseTimes.length > 0 
            ? (responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length).toFixed(2)
            : 0;

          // Get current status
          const currentPing = pings?.[0];
          const currentIsUp = currentPing?.status === 'success' ? 1 : 0;
          const lastChecked = currentPing?.created_at || null;

          return {
            ...monitor,
            uptime_percent: parseFloat(uptime), // ✅ Match frontend expectation
            avg_response_time: parseFloat(avgResponseTime), // ✅ Add missing field
            current_is_up: currentIsUp, // ✅ Add current status
            last_checked: lastChecked, // ✅ Add last checked time
            uptime: parseFloat(uptime), // ✅ Keep for backward compatibility
            total_pings: totalPings,
            successful_pings: successfulPings,
            recent_pings: pings?.map(ping => ({
              response_time: ping.response_time || 0,
              is_up: ping.status === 'success' ? 1 : 0,
              created_at: ping.created_at,
              error_message: ping.status === 'failed' ? 'Connection failed' : undefined
            })) || []
          };
        }) || []
      );

      return res.status(200).json({
        status_page: statusPage,
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
