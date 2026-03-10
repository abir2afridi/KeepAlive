import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-dev';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; plan: string; status_slug?: string };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const id = crypto.randomUUID();
    const hash = await bcrypt.hash(password, 10);
    
    const slug = email.split('@')[0] + '-' + crypto.randomUUID().slice(0, 4);
    
    db.prepare('INSERT INTO users (id, email, password_hash, status_slug) VALUES (?, ?, ?, ?)')
      .run(id, email, hash, slug);

    const token = jwt.sign({ id, email, plan: 'free', status_slug: slug }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id, email, plan: 'free', status_slug: slug } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, plan: user.plan, status_slug: user.status_slug }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, plan: user.plan, status_slug: user.status_slug } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', requireAuth, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

router.put('/profile', requireAuth, async (req: AuthRequest, res) => {
  const { password, status_slug } = req.body;
  const userId = req.user?.id;
  
  try {
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, userId);
    }
    
    if (status_slug) {
      // make sure it's unique
      const existing = db.prepare('SELECT id FROM users WHERE status_slug = ? AND id != ?').get(status_slug, userId);
      if (existing) {
        return res.status(400).json({ error: 'Status slug already taken' });
      }
      db.prepare('UPDATE users SET status_slug = ? WHERE id = ?').run(status_slug, userId);
    }
    
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    const token = jwt.sign({ id: user.id, email: user.email, plan: user.plan, status_slug: user.status_slug }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user.id, email: user.email, plan: user.plan, status_slug: user.status_slug } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Mock Password Reset
router.post('/reset-password', (req, res) => {
  const { email } = req.body;
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as any;
  if (!user) return res.json({ success: true }); // silent success
  
  const resetToken = crypto.randomUUID();
  db.prepare('INSERT INTO password_resets (token, user_id, expires_at) VALUES (?, ?, datetime("now", "+1 hour"))').run(resetToken, user.id);
  
  console.log(`[AUTH] Password reset requested for ${email}. Token: ${resetToken}`);
  // In production, send via nodemailer here
  res.json({ success: true, message: 'If an account exists, a reset link was sent.' });
});

router.post('/reset-password/confirm', async (req, res) => {
  const { token, new_password } = req.body;
  if (!token || !new_password) return res.status(400).json({ error: 'Missing token or password' });
  
  const reset = db.prepare('SELECT user_id FROM password_resets WHERE token = ? AND expires_at > datetime("now")').get(token) as any;
  if (!reset) return res.status(400).json({ error: 'Invalid or expired token' });
  
  const hash = await bcrypt.hash(new_password, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, reset.user_id);
  db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(reset.user_id);
  
  res.json({ success: true });
});

export default router;
