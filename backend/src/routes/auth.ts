import { Router } from 'express';

const router = Router();

const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'o9&S#ShF7hsHAFq$';

/**
 * POST /api/auth/login
 * Login with password and create session
 */
router.post('/login', (req: any, res: any) => {
  const { password } = req.body;

  if (!password) {
    res.status(400).json({ error: 'Password is required' });
    return;
  }

  if (password === AUTH_PASSWORD) {
    req.session.authenticated = true;
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

/**
 * POST /api/auth/logout
 * Destroy the session
 */
router.post('/logout', (req: any, res: any) => {
  req.session.destroy((err: any) => {
    if (err) {
      res.status(500).json({ error: 'Failed to logout' });
    } else {
      res.clearCookie('upevents.sid');
      res.json({ success: true, message: 'Logout successful' });
    }
  });
});

/**
 * GET /api/auth/check
 * Check if the current session is authenticated
 */
router.get('/check', (req: any, res: any) => {
  const authenticated = req.session.authenticated === true;
  res.json({ authenticated });
});

export default router;
