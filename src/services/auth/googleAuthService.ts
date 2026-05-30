import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';

export type GoogleUserPayload = {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  avatarUrl: string | null;
};

dotenv.config();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleUserPayload> {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID is not configured');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    throw new Error('GOOGLE_TOKEN_INVALID');
  }

  if (!payload.sub) {
    throw new Error('GOOGLE_TOKEN_NO_SUB');
  }

  if (!payload.email) {
    throw new Error('GOOGLE_TOKEN_NO_EMAIL');
  }

  if (!payload.email_verified) {
    throw new Error('GOOGLE_EMAIL_NOT_VERIFIED');
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    emailVerified: Boolean(payload.email_verified),
    name: payload.name || null,
    avatarUrl: payload.picture || null,
  };
}
