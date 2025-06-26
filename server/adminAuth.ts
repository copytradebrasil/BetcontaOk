import type { Request, Response, NextFunction } from 'express';

// Admin credentials
const ADMIN_EMAIL = 'copytradeadmin@gmail.com';
const ADMIN_PASSWORD = 'Copy@2025';

// Admin authentication middleware
export const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.session?.adminAuthenticated) {
    return next();
  }
  
  return res.status(401).json({ message: 'Admin authentication required' });
};

// Admin login handler
export const adminLogin = (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    req.session.adminAuthenticated = true;
    return res.json({ success: true, message: 'Admin authenticated successfully' });
  }
  
  return res.status(401).json({ message: 'Invalid admin credentials' });
};

// Admin logout handler
export const adminLogout = (req: Request, res: Response) => {
  req.session.adminAuthenticated = false;
  return res.json({ success: true, message: 'Admin logged out successfully' });
};

// Check admin authentication status
export const adminAuthStatus = (req: Request, res: Response) => {
  return res.json({ authenticated: !!req.session?.adminAuthenticated });
};