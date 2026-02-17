import { Request, Response, NextFunction } from 'express';

// Extend express-session types
declare module 'express-session' {
  interface SessionData {
    authenticated: boolean;
  }
}

/**
 * Middleware to require authentication for protected routes
 * Returns 401 if user is not authenticated
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (req.session.authenticated === true) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized - Authentication required' });
  }
};

/**
 * Check if the current session is authenticated
 */
export const isAuthenticated = (req: Request): boolean => {
  return req.session.authenticated === true;
};
