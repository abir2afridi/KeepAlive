const { createClient } = require('@supabase/supabase-js');
const { createRemoteJWKSet, jwtVerify } = require('jose');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jwks = createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`));

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Authentication middleware
const verifyAuth = async (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    throw new Error('Unauthorized - No token');
  }

  try {
    // Try to get user from Supabase auth first (for Google OAuth tokens)
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      // If getUser fails, try JWT verification as fallback
      try {
        const { payload } = await jwtVerify(token, jwks, {
          issuer: `${supabaseUrl}/auth/v1`,
          audience: 'authenticated',
          clockTolerance: 30,
        });

        const userId = String(payload.sub || '');
        const email = typeof payload.email === 'string' ? payload.email : '';

        if (!userId) {
          throw new Error('Invalid token - missing user ID');
        }

        // Get user from database
        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        return dbUser || { 
          id: userId, 
          email, 
          plan: 'free',
          name: email.split('@')[0],
          status_slug: null
        };
      } catch (jwtError) {
        console.error('Auth error (JWT):', jwtError);
        throw new Error('Invalid token');
      }
    }

    // Use user info from Supabase auth
    const userId = user.id;
    const email = user.email || '';

    // Get user from database
    const { data: dbUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    return dbUser || { 
      id: userId, 
      email, 
      plan: 'free',
      name: user.user_metadata?.full_name || email.split('@')[0],
      status_slug: null
    };
  } catch (error) {
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

  const { url, method } = req;

  try {
    // Route: GET /api/test
    if (url === '/api/test' && method === 'GET') {
      return res.status(200).json({ message: 'API is working!', timestamp: new Date().toISOString() });
    }

    // Route: GET /api/auth/me
    if (url === '/api/auth/me' && method === 'GET') {
      const user = await verifyAuth(req);
      return res.status(200).json({ user });
    }

    // Route: POST /api/auth/sync
    if (url === '/api/auth/sync' && method === 'POST') {
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
    }

    // Route: PUT /api/auth/profile
    if (url === '/api/auth/profile' && method === 'PUT') {
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
    if (url === '/api/monitors' && method === 'GET') {
      const user = await verifyAuth(req);

      // Get all monitors for the user
      const { data: monitors } = await supabase
        .from('monitors')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      return res.status(200).json({ monitors });
    }

    // Route: POST /api/monitors
    if (url === '/api/monitors' && method === 'POST') {
      const user = await verifyAuth(req);
      const { name, url: monitorUrl, type, interval, timeout } = req.body;

      const { data: monitor } = await supabase
        .from('monitors')
        .insert({
          user_id: user.id,
          name,
          url: monitorUrl,
          type: type || 'http',
          interval: interval || 60,
          timeout: timeout || 30,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      return res.status(201).json({ monitor });
    }

    // Route: GET /api/stats
    if (url === '/api/stats' && method === 'GET') {
      const user = await verifyAuth(req);

      // Get monitor stats
      const { data: monitors } = await supabase
        .from('monitors')
        .select('status')
        .eq('user_id', user.id);

      const totalMonitors = monitors?.length || 0;
      const activeMonitors = monitors?.filter(m => m.status === 'active').length || 0;
      const inactiveMonitors = totalMonitors - activeMonitors;

      // Get ping stats (simplified)
      const { data: pings } = await supabase
        .from('pings')
        .select('status')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

      const totalPings = pings?.length || 0;
      const successfulPings = pings?.filter(p => p.status === 'success').length || 0;
      const failedPings = totalPings - successfulPings;
      const uptime = totalPings > 0 ? (successfulPings / totalPings * 100).toFixed(2) : 0;

      return res.status(200).json({
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
    if (url === '/api/alerts' && method === 'GET') {
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
    if (url === '/api/alerts' && method === 'POST') {
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

    // Route: GET /api/public-status
    if (url === '/api/public-status' && method === 'GET') {
      const { slug } = req.query;

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
            .select('status, created_at')
            .eq('monitor_id', monitor.id)
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
            .order('created_at', { ascending: false })
            .limit(100);

          const totalPings = pings?.length || 0;
          const successfulPings = pings?.filter(p => p.status === 'success').length || 0;
          const uptime = totalPings > 0 ? (successfulPings / totalPings * 100).toFixed(2) : 0;

          return {
            ...monitor,
            uptime: parseFloat(uptime),
            total_pings: totalPings,
            successful_pings: successfulPings
          };
        }) || []
      );

      return res.status(200).json({
        status_page: statusPage,
        monitors: monitorsWithPings
      });
    }

    // Default response
    res.status(404).json({ error: 'Route not found', url, method });
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
