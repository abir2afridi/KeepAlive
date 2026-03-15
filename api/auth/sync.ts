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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - No token' });
  }

  try {
    // For Google OAuth tokens, we need to get the user info from the token
    // Since we can't verify Google OAuth tokens server-side easily,
    // we'll use the Supabase admin client to get user info
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

        // Ensure user exists in database
        await supabase
          .from('users')
          .upsert({ id: userId, email }, { onConflict: 'id' });

        const userData = { 
          id: userId, 
          email, 
          plan: 'free',
          name: email.split('@')[0],
          status_slug: null
        };

        return res.status(200).json({ user: userData });
      } catch (jwtError: any) {
        console.error('Auth sync error (JWT):', jwtError);
        return res.status(401).json({ 
          error: 'Invalid token',
          details: jwtError.message 
        });
      }
    }

    // Use user info from Supabase auth
    const userId = user.id;
    const email = user.email || '';

    // Ensure user exists in database
    await supabase
      .from('users')
      .upsert({ 
        id: userId, 
        email, 
        name: user.user_metadata?.full_name || email.split('@')[0]
      }, { onConflict: 'id' });

    const userData = { 
      id: userId, 
      email, 
      plan: 'free',
      name: user.user_metadata?.full_name || email.split('@')[0],
      status_slug: null
    };

    return res.status(200).json({ user: userData });
  } catch (error: any) {
    console.error('Auth sync error:', error);
    return res.status(401).json({ 
      error: 'Invalid token',
      details: error.message 
    });
  }
}
