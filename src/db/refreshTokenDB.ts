import { pool } from './db';

export type DBRefreshToken = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  revoked: boolean;
  revoked_at: string | null;
  device_info: string | null;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
  last_used_at: string | null;
};

export type UserSession = {
  id: string;
  device_info: string | null;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
  last_used_at: string | null;
  expires_at: string;
};

export async function insertRefreshToken(params: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  deviceInfo?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
}) {
  await pool.query(
    `
    INSERT INTO "RefreshToken"
      (
        user_id,
        token_hash,
        expires_at,
        device_info,
        user_agent,
        ip_address
      )
    VALUES
      ($1, $2, $3, $4, $5, $6)
    `,
    [
      params.userId,
      params.tokenHash,
      params.expiresAt,
      params.deviceInfo || null,
      params.userAgent || null,
      params.ipAddress || null,
    ],
  );
}

export async function findValidRefreshTokenByHash(tokenHash: string): Promise<DBRefreshToken | null> {
  const result = await pool.query<DBRefreshToken>(
    `
    SELECT *
    FROM "RefreshToken"
    WHERE token_hash = $1
      AND revoked = false
      AND expires_at > NOW()
    `,
    [tokenHash],
  );

  return result.rows[0] || null;
}

export async function markRefreshTokenUsed(id: string) {
  await pool.query(
    `
    UPDATE "RefreshToken"
    SET last_used_at = NOW()
    WHERE id = $1
    `,
    [id],
  );
}

export async function revokeRefreshTokenById(id: string) {
  await pool.query(
    `
    UPDATE "RefreshToken"
    SET revoked = true,
        revoked_at = NOW(),
        last_used_at = NOW()
    WHERE id = $1
    `,
    [id],
  );
}

export async function revokeRefreshTokenByHash(tokenHash: string) {
  await pool.query(
    `
    UPDATE "RefreshToken"
    SET revoked = true,
        revoked_at = NOW(),
        last_used_at = NOW()
    WHERE token_hash = $1
    `,
    [tokenHash],
  );
}

export async function revokeAllUserRefreshTokens(userId: string) {
  await pool.query(
    `
    UPDATE "RefreshToken"
    SET revoked = true,
        revoked_at = NOW()
    WHERE user_id = $1
      AND revoked = false
    `,
    [userId],
  );
}

export async function revokeSessionById(sessionId: string, userId: string) {
  await pool.query(
    `
    UPDATE "RefreshToken"
    SET revoked = true,
        revoked_at = NOW()
    WHERE id = $1
      AND user_id = $2
      AND revoked = false
    `,
    [sessionId, userId],
  );
}

export async function getUserSessions(userId: string): Promise<UserSession[]> {
  const result = await pool.query<UserSession>(
    `
    SELECT
      id,
      device_info,
      user_agent,
      ip_address,
      created_at,
      last_used_at,
      expires_at
    FROM "RefreshToken"
    WHERE user_id = $1
      AND revoked = false
      AND expires_at > NOW()
    ORDER BY COALESCE(last_used_at, created_at) DESC
    `,
    [userId],
  );

  return result.rows;
}
