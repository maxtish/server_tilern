import crypto from 'crypto';
import { pool } from '../db/db';

const REFRESH_TTL_DAYS = 30;

export const createRefreshToken = async (userId: string, deviceInfo?: string) => {
  const token = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TTL_DAYS);

  await pool.query(
    `INSERT INTO "RefreshToken"(user_id, token, expires_at, device_info)
     VALUES ($1, $2, $3, $4)`,
    [userId, token, expiresAt, deviceInfo || null]
  );

  return token;
};
