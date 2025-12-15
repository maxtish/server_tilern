import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UserRole, AuthUser } from '../types/express';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const [type, token] = authHeader.split(' ');

  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Invalid authorization format' });
  }

  try {
    const payload = verifyAccessToken(token) as AuthUser;

    const validRoles: UserRole[] = ['USER', 'PREMIUM', 'EDITOR', 'ADMIN'];
    if (!validRoles.includes(payload.role)) {
      return res.status(401).json({ error: 'Invalid role in token' });
    }

    req.user = payload; // теперь строго AuthUser
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Middleware для ролей
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
};
