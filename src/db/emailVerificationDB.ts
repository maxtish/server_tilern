import { pool } from './db';

export async function insertEmailVerificationToken(params: { userId: string; tokenHash: string; expiresAt: Date }) {
  await pool.query(
    `
    INSERT INTO "EmailVerificationToken"
      (user_id, token_hash, expires_at)
    VALUES
      ($1, $2, $3)
    `,
    [params.userId, params.tokenHash, params.expiresAt],
  );
}

export async function findValidEmailVerificationToken(tokenHash: string) {
  const result = await pool.query(
    `
    SELECT *
    FROM "EmailVerificationToken"
    WHERE token_hash = $1
      AND used = false
      AND expires_at > NOW()
    `,
    [tokenHash],
  );

  return result.rows[0] || null;
}

export async function markEmailVerificationTokenUsed(id: string) {
  await pool.query(
    `
    UPDATE "EmailVerificationToken"
    SET used = true
    WHERE id = $1
    `,
    [id],
  );
}

export async function markUserEmailVerified(userId: string) {
  await pool.query(
    `
    UPDATE "User"
    SET email_verified = true,
        updated_at = NOW()
    WHERE id = $1
    `,
    [userId],
  );
}
