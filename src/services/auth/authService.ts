import bcrypt from 'bcrypt';
import { pool } from '../../db/db';
import { DBUser, mapDBUserToUser, User } from '../../types/user';
import { signAccessToken } from '../../utils/jwt';
import { createRefreshToken, hashRefreshToken } from '../../utils/refreshToken';
import {
  findValidRefreshTokenByHash,
  revokeRefreshTokenByHash,
  revokeRefreshTokenById,
  markRefreshTokenUsed,
  revokeAllUserRefreshTokens,
  revokeSessionById,
  getUserSessions,
} from '../../db/refreshTokenDB';
import { verifyGoogleIdToken } from './googleAuthService';
import { createAndSendEmailVerification } from './emailVerificationService';

type AuthErrorCode =
  | 'VALIDATION_ERROR'
  | 'EMAIL_ALREADY_EXISTS'
  | 'USER_NOT_FOUND'
  | 'INVALID_PASSWORD'
  | 'REFRESH_TOKEN_REQUIRED'
  | 'INVALID_REFRESH_TOKEN'
  | 'USER_NOT_FOUND_BY_TOKEN'
  | 'GOOGLE_TOKEN_REQUIRED'
  | 'GOOGLE_AUTH_FAILED';

class AuthError extends Error {
  code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

function issueAccessToken(user: User, sessionId: string) {
  return signAccessToken({
    id: user.id,
    role: user.role,
    sessionId,
  });
}

async function issueRefreshToken(params: {
  userId: string;
  deviceInfo?: string | string[] | null;
  userAgent?: string | string[] | null;
  ipAddress?: string | null;
}) {
  return createRefreshToken({
    userId: params.userId,
    deviceInfo: normalizeHeader(params.deviceInfo || undefined),
    userAgent: normalizeHeader(params.userAgent || undefined),
    ipAddress: params.ipAddress || null,
  });
}

export async function registerUser(params: {
  email: string;
  password: string;
  name?: string;
  deviceInfo?: string | string[];
  userAgent?: string | string[];
  ipAddress?: string | null;
}) {
  const { email, password, name, deviceInfo, userAgent, ipAddress } = params;

  if (!email || !password) {
    throw new AuthError('VALIDATION_ERROR', 'Email and password required');
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    throw new AuthError('VALIDATION_ERROR', 'Введите корректный email');
  }

  const hashed = await bcrypt.hash(password, 10);
  const client = await pool.connect();

  try {
    const result = await client.query<DBUser>(
      `
        INSERT INTO "User"(email, password_hash, name, email_verified)
        VALUES($1, $2, $3, false)
        RETURNING *
        `,
      [normalizedEmail, hashed, name],
    );

    const user = mapDBUserToUser(result.rows[0]);

    const refreshTokenData = await issueRefreshToken({
      userId: user.id,
      deviceInfo,
      userAgent,
      ipAddress,
    });

    const accessToken = issueAccessToken(user, refreshTokenData.sessionId);

    /**
     * Отправляем письмо подтверждения.
     * Если SMTP упал — регистрацию не ломаем.
     */
    createAndSendEmailVerification({
      userId: user.id,
      email: user.email,
    }).catch((err) => {
      console.error('Email verification send failed:', err);
    });

    return {
      user,
      accessToken,
      refreshToken: refreshTokenData.token,
    };
  } catch (err: any) {
    if (err.code === '23505') {
      throw new AuthError('EMAIL_ALREADY_EXISTS', 'Email already exists');
    }

    throw err;
  } finally {
    client.release();
  }
}

export async function loginUser(params: {
  email: string;
  password: string;
  deviceInfo?: string | string[];
  userAgent?: string | string[];
  ipAddress?: string | null;
}) {
  const { email, password, deviceInfo, userAgent, ipAddress } = params;

  if (!email || !password) {
    throw new AuthError('VALIDATION_ERROR', 'Email and password required');
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    throw new AuthError('VALIDATION_ERROR', 'Введите корректный email');
  }

  const client = await pool.connect();

  try {
    const result = await client.query<DBUser>('SELECT * FROM "User" WHERE email = $1', [normalizedEmail]);

    const dbUser = result.rows[0];

    if (!dbUser) {
      throw new AuthError('USER_NOT_FOUND', 'User not found');
    }

    const match = await bcrypt.compare(password, dbUser.password_hash || '');

    if (!match) {
      throw new AuthError('INVALID_PASSWORD', 'Invalid password');
    }

    const user = mapDBUserToUser(dbUser);

    const refreshTokenData = await issueRefreshToken({
      userId: user.id,
      deviceInfo,
      userAgent,
      ipAddress,
    });

    const accessToken = issueAccessToken(user, refreshTokenData.sessionId);

    return {
      user,
      accessToken,
      refreshToken: refreshTokenData.token,
    };
  } finally {
    client.release();
  }
}

export async function loginWithGoogle(params: {
  idToken: string;
  deviceInfo?: string | string[];
  userAgent?: string | string[];
  ipAddress?: string | null;
}) {
  const { idToken, deviceInfo, userAgent, ipAddress } = params;

  if (!idToken) {
    throw new AuthError('GOOGLE_TOKEN_REQUIRED', 'Google token required');
  }

  try {
    const googleUser = await verifyGoogleIdToken(idToken);

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      let result = await client.query<DBUser>('SELECT * FROM "User" WHERE google_id = $1', [googleUser.googleId]);

      let dbUser = result.rows[0];

      if (!dbUser) {
        result = await client.query<DBUser>('SELECT * FROM "User" WHERE email = $1', [googleUser.email]);

        dbUser = result.rows[0];

        if (dbUser) {
          const updated = await client.query<DBUser>(
            `
              UPDATE "User"
              SET google_id = $1,
                  email_verified = true,
                  name = COALESCE(name, $2),
                  avatar_url = COALESCE(avatar_url, $3),
                  updated_at = NOW()
              WHERE id = $4
              RETURNING *
              `,
            [googleUser.googleId, googleUser.name, googleUser.avatarUrl, dbUser.id],
          );

          dbUser = updated.rows[0];
        }
      }

      if (!dbUser) {
        const created = await client.query<DBUser>(
          `
            INSERT INTO "User"
              (email, google_id, name, avatar_url, role, email_verified)
            VALUES
              ($1, $2, $3, $4, 'USER', true)
            RETURNING *
            `,
          [googleUser.email, googleUser.googleId, googleUser.name, googleUser.avatarUrl],
        );

        dbUser = created.rows[0];
      }

      await client.query('COMMIT');

      const user = mapDBUserToUser(dbUser);

      const refreshTokenData = await issueRefreshToken({
        userId: user.id,
        deviceInfo,
        userAgent,
        ipAddress,
      });

      const accessToken = issueAccessToken(user, refreshTokenData.sessionId);

      return {
        user,
        accessToken,
        refreshToken: refreshTokenData.token,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    if (err instanceof AuthError) {
      throw err;
    }

    console.error('Google auth failed:', err);
    throw new AuthError('GOOGLE_AUTH_FAILED', 'Google auth failed');
  }
}

export async function refreshUserToken(refreshToken: string) {
  if (!refreshToken) {
    throw new AuthError('REFRESH_TOKEN_REQUIRED', 'Refresh token required');
  }

  const refreshTokenHash = hashRefreshToken(refreshToken);
  const stored = await findValidRefreshTokenByHash(refreshTokenHash);

  if (!stored) {
    throw new AuthError('INVALID_REFRESH_TOKEN', 'Invalid refresh token');
  }

  await markRefreshTokenUsed(stored.id);
  await revokeRefreshTokenById(stored.id);

  const userRes = await pool.query('SELECT id, role FROM "User" WHERE id = $1', [stored.user_id]);

  const user = userRes.rows[0];

  if (!user) {
    throw new AuthError('USER_NOT_FOUND_BY_TOKEN', 'User not found');
  }

  const newRefreshTokenData = await createRefreshToken({
    userId: user.id,
    deviceInfo: stored.device_info,
    userAgent: stored.user_agent,
    ipAddress: stored.ip_address,
  });

  const newAccessToken = signAccessToken({
    id: user.id,
    role: user.role,
    sessionId: newRefreshTokenData.sessionId,
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshTokenData.token,
  };
}

export async function logoutUser(refreshToken?: string) {
  if (!refreshToken) return;

  const refreshTokenHash = hashRefreshToken(refreshToken);
  await revokeRefreshTokenByHash(refreshTokenHash);
}

export async function logoutAllDevices(userId: string) {
  await revokeAllUserRefreshTokens(userId);
}

export async function logoutDevice(userId: string, sessionId: string) {
  await revokeSessionById(sessionId, userId);
}

export async function getSessions(userId: string) {
  return getUserSessions(userId);
}

function normalizeHeader(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  return value;
}

export async function getMe(userId: string) {
  const result = await pool.query<DBUser>(
    `
    SELECT *
    FROM "User"
    WHERE id = $1
    `,
    [userId],
  );

  const dbUser = result.rows[0];

  if (!dbUser) {
    throw new AuthError('USER_NOT_FOUND', 'User not found');
  }

  return mapDBUserToUser(dbUser);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function changeUserEmail(params: { userId: string; email: string }) {
  const email = params.email.trim().toLowerCase();

  if (!email) {
    throw new AuthError('VALIDATION_ERROR', 'Email required');
  }

  if (!isValidEmail(email)) {
    throw new AuthError('VALIDATION_ERROR', 'Введите корректный email');
  }

  const client = await pool.connect();

  try {
    const existing = await client.query<DBUser>(
      `
      SELECT *
      FROM "User"
      WHERE email = $1
        AND id <> $2
      `,
      [email, params.userId],
    );

    if (existing.rows[0]) {
      throw new AuthError('EMAIL_ALREADY_EXISTS', 'Email already exists');
    }

    const result = await client.query<DBUser>(
      `
      UPDATE "User"
      SET email = $1,
          email_verified = false,
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
      `,
      [email, params.userId],
    );

    const dbUser = result.rows[0];

    if (!dbUser) {
      throw new AuthError('USER_NOT_FOUND', 'User not found');
    }

    const user = mapDBUserToUser(dbUser);

    await createAndSendEmailVerification({
      userId: user.id,
      email: user.email,
    });

    return {
      success: true,
      user,
    };
  } finally {
    client.release();
  }
}
