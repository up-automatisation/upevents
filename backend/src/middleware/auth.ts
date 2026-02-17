/**
 * Middleware to require authentication for protected routes
 * Returns 401 if user is not authenticated
 */
export const requireAuth = (req: any, res: any, next: any): void => {
  if (req.session.authenticated === true) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized - Authentication required' });
  }
};

/**
 * Check if the current session is authenticated
 */
export const isAuthenticated = (req: any): boolean => {
  return req.session.authenticated === true;
};
