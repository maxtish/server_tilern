import jwt from 'jsonwebtoken';
import { UserRole } from '../types/express';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export function signAccessToken(payload: { id: string; role: UserRole; sessionId: string }) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '15m',
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as {
    id: string;
    role: UserRole;
    sessionId?: string;
  };
}
