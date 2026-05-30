import bcrypt from 'bcrypt';
import {
  findUserByEmail,
  insertPasswordResetToken,
  findValidPasswordResetToken,
  markPasswordResetTokenUsed,
  updateUserPassword,
} from '../../db/passwordResetDB';
import { createRandomToken, hashToken } from '../../utils/tokenHash';
import { sendPasswordResetEmail } from '../email/emailService';
import dotenv from 'dotenv';
const PASSWORD_RESET_TTL_HOURS = 1;
dotenv.config();
export async function requestPasswordReset(email: string) {
  /**
   * Важно:
   * Даже если email не найден, возвращаем success.
   * Так нельзя проверить, какие email зарегистрированы.
   */
  if (!email) {
    return { success: true };
  }

  const user = await findUserByEmail(email);

  if (!user) {
    return { success: true };
  }

  const token = createRandomToken();
  const tokenHash = hashToken(token);

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + PASSWORD_RESET_TTL_HOURS);

  await insertPasswordResetToken({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  const baseUrl = process.env.APP_PUBLIC_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

  await sendPasswordResetEmail({
    to: user.email,
    resetUrl,
    token,
  });

  return { success: true };
}

export async function resetPassword(params: { token: string; newPassword: string }) {
  if (!params.token) {
    throw new Error('PASSWORD_RESET_TOKEN_REQUIRED');
  }

  if (!params.newPassword || params.newPassword.length < 6) {
    throw new Error('PASSWORD_TOO_SHORT');
  }

  const tokenHash = hashToken(params.token);
  const stored = await findValidPasswordResetToken(tokenHash);

  if (!stored) {
    throw new Error('PASSWORD_RESET_TOKEN_INVALID');
  }

  const passwordHash = await bcrypt.hash(params.newPassword, 10);

  await updateUserPassword({
    userId: stored.user_id,
    passwordHash,
  });

  await markPasswordResetTokenUsed(stored.id);

  return { success: true };
}
