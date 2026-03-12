import { Router, Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { supabaseAdmin } from './supabase/server-client.js';

const router = Router();

export interface AuthRequest extends Request {
  user?: { id: string; email: string; plan: string; status_slug?: string; name?: string };
}

import { redisCache } from './redis-cache.js';

const supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL');
}

const jwksUrl = new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`);
const jwks = createRemoteJWKSet(jwksUrl);

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  console.log('[AUTH] Checking token:', token ? `${token.slice(0, 20)}...` : 'missing');
  
  if (!token) {
    console.log('[AUTH] No token provided');
    return res.status(401).json({ error: 'Unauthorized - No token' });
  }

  // Check cache first — avoids Firebase Admin calls on every request
  const cached = await redisCache.getAuthUser(token);
  if (cached) {
    console.log('[AUTH] Found cached user:', cached.email);
    req.user = cached;
    return next();
  }

  try {
    console.log('[AUTH] Verifying JWT token...');
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `${supabaseUrl}/auth/v1`,
      audience: 'authenticated',
      clockTolerance: 30,
    });

    const userId = String(payload.sub || '');
    const email = typeof payload.email === 'string' ? payload.email : '';

    console.log('[AUTH] Token verified for user:', email, 'ID:', userId);

    if (!userId) {
      console.log('[AUTH] Invalid token - no user ID');
      return res.status(401).json({ error: 'Invalid token - missing user ID' });
    }

    // Ensure a user row exists (best-effort). This keeps the app DB-centric.
    try {
      await supabaseAdmin
        .from('users')
        .upsert({ id: userId, email }, { onConflict: 'id' });
    } catch (e) {
      console.warn('[AUTH] user upsert failed (continuing):', e);
    }

    const user: AuthRequest['user'] = {
      id: userId,
      email,
      plan: 'free',
    };

    // Store in cache
    await redisCache.setAuthUser(token, user!);
    console.log('[AUTH] User cached and authenticated successfully');

    req.user = user;
    next();
  } catch (error: any) {
    console.error('[AUTH] Authentication error:', error.message || error);
    console.error('[AUTH] Full error:', error);
    res.status(401).json({
      error: 'Invalid token',
      details: process.env.NODE_ENV === 'development' ? (error?.message || String(error)) : undefined,
    });
  }
};

router.post('/sync', requireAuth, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

router.get('/me', requireAuth, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

router.put('/profile', requireAuth, async (req: AuthRequest, res) => {
  const { status_slug, name } = req.body;
  const userId = req.user?.id;
  
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const patch: any = {};
    if (status_slug !== undefined) patch.status_slug = status_slug;
    if (name !== undefined) patch.name = name;

    if (Object.keys(patch).length > 0) {
      const { data: updatedData, error } = await supabaseAdmin
        .from('users')
        .update(patch)
        .eq('id', userId)
        .select('*')
        .single();

      if (error) {
        console.error('[AUTH] profile update error:', error);
        return res.status(500).json({ error: 'Server error' });
      }

      // Clear the auth cache for this session
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        await redisCache.setAuthUser(token, {
          id: updatedData?.id,
          email: updatedData?.email,
          plan: updatedData?.plan || 'free',
          name: updatedData?.name,
          status_slug: updatedData?.status_slug
        });
      }

      return res.json({ success: true, user: updatedData });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
