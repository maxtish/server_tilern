import { pool } from '../../db/db';
import {
  insertEmailVerificationToken,
  findValidEmailVerificationToken,
  markEmailVerificationTokenUsed,
  markUserEmailVerified,
} from '../../db/emailVerificationDB';
import { createRandomToken, hashToken } from '../../utils/tokenHash';
import { sendVerificationEmail } from '../email/emailService';
import dotenv from 'dotenv';
import { Response } from 'express';
const EMAIL_VERIFY_TTL_HOURS = 24;

dotenv.config();

export async function createAndSendEmailVerification(params: { userId: string; email: string }) {
  const token = createRandomToken();
  const tokenHash = hashToken(token);

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + EMAIL_VERIFY_TTL_HOURS);

  await insertEmailVerificationToken({
    userId: params.userId,
    tokenHash,
    expiresAt,
  });

  const baseUrl = process.env.APP_PUBLIC_URL || 'http://localhost:3000';

  const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`;

  await sendVerificationEmail({
    to: params.email,
    verificationUrl,
  });
}

export async function verifyEmailByToken(res: Response, token: string) {
  if (!token) {
    throw new Error('EMAIL_VERIFICATION_TOKEN_REQUIRED');
  }

  const tokenHash = hashToken(token);
  const stored = await findValidEmailVerificationToken(tokenHash);

  if (!stored) {
    throw new Error('EMAIL_VERIFICATION_TOKEN_INVALID');
  }

  await markEmailVerificationTokenUsed(stored.id);
  await markUserEmailVerified(stored.user_id);

  return res.send(`
  <!DOCTYPE html>
  <html lang="ru">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Email подтверждён</title>
      <style>
        body {
          margin: 0;
          font-family: Arial, sans-serif;
          background: #f4f6fb;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .card {
          background: white;
          padding: 32px;
          border-radius: 20px;
          max-width: 420px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        h1 { color: #22c55e; }
        p { color: #555; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>✅ Email подтверждён</h1>
        <p>Ваш email успешно подтверждён.</p>
        <p>Теперь можно вернуться в приложение TiLern.</p>
      </div>
    </body>
  </html>
`);
}

export async function resendEmailVerification(userId: string) {
  const result = await pool.query(
    `
    SELECT id, email, email_verified
    FROM "User"
    WHERE id = $1
    `,
    [userId],
  );

  const user = result.rows[0];

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  if (user.email_verified) {
    return { success: true, alreadyVerified: true };
  }

  await createAndSendEmailVerification({
    userId: user.id,
    email: user.email,
  });

  return { success: true };
}
