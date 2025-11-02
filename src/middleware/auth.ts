import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { UserRole } from '../types/express';

// Определяем допустимые роли

interface JwtPayload {
  id: string;
  role: UserRole;
  email?: string;
  name?: string;
}

// Расширяем Request, чтобы добавить поле user
declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1]; // Bearer <token>

  try {
    const payload = verifyToken(token) as JwtPayload;

    // Проверяем корректность роли
    const validRoles: UserRole[] = ['USER', 'PREMIUM', 'EDITOR', 'ADMIN'];
    if (!validRoles.includes(payload.role)) {
      return res.status(401).json({ error: 'Invalid role in token' });
    }

    req.user = payload; // безопасно
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware для ролей
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient rights' });
    }

    next();
  };
};
