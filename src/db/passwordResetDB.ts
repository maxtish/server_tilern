import { pool } from './db';

export async function insertPasswordResetToken(params: { userId: string; tokenHash: string; expiresAt: Date }) {
  await pool.query(
    `
    INSERT INTO "PasswordResetToken"
      (user_id, token_hash, expires_at)
    VALUES
      ($1, $2, $3)
    `,
    [params.userId, params.tokenHash, params.expiresAt],
  );
}

export async function findValidPasswordResetToken(tokenHash: string) {
  const result = await pool.query(
    `
    SELECT *
    FROM "PasswordResetToken"
    WHERE token_hash = $1
      AND used = false
      AND expires_at > NOW()
    `,
    [tokenHash],
  );

  return result.rows[0] || null;
}

export async function markPasswordResetTokenUsed(id: string) {
  await pool.query(
    `
    UPDATE "PasswordResetToken"
    SET used = true
    WHERE id = $1
    `,
    [id],
  );
}

export async function updateUserPassword(params: { userId: string; passwordHash: string }) {
  await pool.query(
    `
    UPDATE "User"
    SET password_hash = $1,
        updated_at = NOW()
    WHERE id = $2
    `,
    [params.passwordHash, params.userId],
  );
}

export async function findUserByEmail(email: string) {
  const result = await pool.query(
    `
    SELECT id, email
    FROM "User"
    WHERE email = $1
    `,
    [email],
  );

  return result.rows[0] || null;
}
