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

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - No token' });
  }

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `${supabaseUrl}/auth/v1`,
      audience: 'authenticated',
      clockTolerance: 30,
    });

    const userId = String(payload.sub || '');

    if (!userId) {
      return res.status(401).json({ error: 'Invalid token - missing user ID' });
    }

    const { status_slug, name } = req.body;
    const patch: any = {};
    if (status_slug !== undefined) patch.status_slug = status_slug;
    if (name !== undefined) patch.name = name;

    if (Object.keys(patch).length > 0) {
      const { data: updatedData, error } = await supabase
        .from('users')
        .update(patch)
        .eq('id', userId)
        .select('*')
        .single();

      if (error) {
        console.error('Profile update error:', error);
        return res.status(500).json({ error: 'Server error' });
      }

      return res.json({ success: true, user: updatedData });
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error('Auth profile error:', error);
    return res.status(401).json({ 
      error: 'Invalid token',
      details: error.message 
    });
  }
}
