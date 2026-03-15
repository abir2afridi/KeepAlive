import { createClient } from '@supabase/supabase-js';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const jwks = createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`));

export default async function handler(req: any, res: any) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - No token' });
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
          return res.status(401).json({ error: 'Invalid token - missing user ID' });
        }

        // Get user from database
        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        return res.status(200).json({ 
          user: dbUser || { 
            id: userId, 
            email, 
            plan: 'free',
            name: email.split('@')[0],
            status_slug: null
          } 
        });
      } catch (jwtError: any) {
        console.error('Auth error (JWT):', jwtError);
        return res.status(401).json({ 
          error: 'Invalid token',
          details: jwtError.message 
        });
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

    return res.status(200).json({ 
      user: dbUser || { 
        id: userId, 
        email, 
        plan: 'free',
        name: user.user_metadata?.full_name || email.split('@')[0],
        status_slug: null
      } 
    });
  } catch (error: any) {
    console.error('Auth error:', error);
    return res.status(401).json({ 
      error: 'Invalid token',
      details: error.message 
    });
  }
}
