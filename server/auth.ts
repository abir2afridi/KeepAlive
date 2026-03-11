import { Router, Request, Response, NextFunction } from 'express';
import { adminAuth, adminDb } from './firebase-admin.js';

const router = Router();

export interface AuthRequest extends Request {
  user?: { id: string; email: string; plan: string; status_slug?: string; name?: string };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Get user data from Firestore
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();

    if (!userData) {
      // If user exists in Auth but not in Firestore, create it
      const slug = decodedToken.email?.split('@')[0] + '-' + Math.random().toString(36).substring(2, 6);
      const newUser = {
        id: decodedToken.uid,
        email: decodedToken.email || '',
        plan: 'free',
        status_slug: slug,
        created_at: new Date().toISOString()
      };
      await adminDb.collection('users').doc(decodedToken.uid).set(newUser);
      req.user = newUser;
    } else {
      req.user = {
        id: userData.id,
        email: userData.email,
        plan: userData.plan,
        name: userData.name,
        status_slug: userData.status_slug
      };
    }
    
    next();
  } catch (error: any) {
    console.error('Auth Error Detailed:', error);
    res.status(401).json({ error: 'Invalid token', details: error.message });
  }
};

// Signup and Login are now handled on the frontend via Firebase SDK.
// The backend just needs to sync the user profile if it doesn't exist.
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
    if (status_slug) {
      // Check if slug is unique
      const existing = await adminDb.collection('users')
        .where('status_slug', '==', status_slug)
        .where('id', '!=', userId)
        .get();
        
      if (!existing.empty) {
        return res.status(400).json({ error: 'Status slug already taken' });
      }
      
      await adminDb.collection('users').doc(userId).update({ status_slug });
    }
    
    if (name !== undefined) {
      await adminDb.collection('users').doc(userId).update({ name });
      
      // Update Firebase Auth Display Name if needed
      await adminAuth.updateUser(userId, { displayName: name });
    }

    if (req.body.password) {
      await adminAuth.updateUser(userId, {
        password: req.body.password
      });
    }
    
    const userDoc = await adminDb.collection('users').doc(userId).get();
    res.json({ success: true, user: userDoc.data() });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
