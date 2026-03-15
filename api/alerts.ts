import { createClient } from '@supabase/supabase-js';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const jwks = createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`));

async function verifyAuth(req: any) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    throw new Error('Unauthorized - No token');
  }

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

    return { userId, email };
  } catch (error: any) {
    throw new Error('Invalid token');
  }
}

export default async function handler(req: any, res: any) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { userId } = await verifyAuth(req);

    if (req.method === 'GET') {
      // Get user's alert channels
      const { data: alerts, error } = await supabase
        .from('alert_channels')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Alerts fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch alerts' });
      }

      return res.status(200).json(alerts || []);
    }
    
    if (req.method === 'POST') {
      // Create new alert channel
      const alertData = { ...req.body, user_id: userId };
      
      const { data: alert, error } = await supabase
        .from('alert_channels')
        .insert(alertData)
        .select('*')
        .single();

      if (error) {
        console.error('Alert creation error:', error);
        return res.status(500).json({ error: 'Failed to create alert' });
      }

      return res.status(201).json(alert);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Alerts API error:', error);
    return res.status(401).json({ 
      error: 'Unauthorized',
      details: error.message 
    });
  }
}
