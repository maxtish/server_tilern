import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UserRole, AuthUser } from '../types/express';
import { findActiveSessionById } from '../db/refreshTokenDB';

const validRoles: UserRole[] = ['USER', 'PREMIUM', 'EDITOR', 'ADMIN'];

const validatePayloadSession = async (payload: AuthUser) => {
  if (!validRoles.includes(payload.role)) {
    return false;
  }

  if (!payload.sessionId) {
    return false;
  }

  const activeSession = await findActiveSessionById(payload.sessionId, payload.id);

  return Boolean(activeSession);
};

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
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

    const isValid = await validatePayloadSession(payload);

    if (!isValid) {
      return res.status(401).json({ error: 'Session revoked' });
    }

    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

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

export const authenticateOptional = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  const [type, token] = authHeader.split(' ');

  if (type !== 'Bearer' || !token) {
    return next();
  }

  try {
    const payload = verifyAccessToken(token) as AuthUser;

    const isValid = await validatePayloadSession(payload);

    if (!isValid) {
      return res.status(401).json({ error: 'Session revoked' });
    }

    req.user = payload;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Ваша сессия истекла, обновляем токен...',
      });
    }

    return res.status(401).json({ error: 'Invalid token' });
  }
};
