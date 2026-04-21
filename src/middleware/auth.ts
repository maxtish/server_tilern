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

export const authenticateOptional = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  // 1. Если токена нет совсем — это 100% аноним, просто идем дальше
  if (!authHeader) {
    return next();
  }

  // 2. Если заголовок есть, проверяем его формат
  const [type, token] = authHeader.split(' ');

  if (type !== 'Bearer' || !token) {
    // Если формат кривой (например, "Bearer undefined"),
    // считаем это отсутствием авторизации и пускаем как гостя
    return next();
  }

  try {
    // 3. Пытаемся верифицировать токен
    const payload = verifyAccessToken(token) as AuthUser;

    // Если всё ок — записываем юзера в запрос
    req.user = payload;
    next();
  } catch (err: any) {
    /** * 4. А вот тут самая важная часть:
     * Если пользователь ПРИСЛАЛ токен, но он не прошел проверку.
     */

    // Если токен именно протух по времени
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Ваша сессия истекла, обновляем токен...',
      });
    }

    // Если токен поддельный или поврежден
    // Можно либо тоже кинуть 401, либо просто пропустить как гостя
    // Чаще всего лучше кинуть 401, чтобы клиент очистил невалидный стейт
    return res.status(401).json({ error: 'Invalid token' });
  }
};
