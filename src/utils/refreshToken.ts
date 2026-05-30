import crypto from 'crypto';
import { insertRefreshToken } from '../db/refreshTokenDB';

const REFRESH_TTL_DAYS = 30;

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createRefreshToken(params: {
  userId: string;
  deviceInfo?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
}) {
  const token = crypto.randomBytes(64).toString('hex');
  const tokenHash = hashRefreshToken(token);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TTL_DAYS);

  await insertRefreshToken({
    userId: params.userId,
    tokenHash,
    expiresAt,
    deviceInfo: params.deviceInfo || null,
    userAgent: params.userAgent || null,
    ipAddress: params.ipAddress || null,
  });

  return token;
}
