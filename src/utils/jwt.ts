import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const SECRET = process.env.JWT_SECRET || 'supersecret';

export interface AccessPayload {
  id: string;
  role: string;
}

export const signAccessToken = (payload: AccessPayload) => {
  return jwt.sign(payload, SECRET, { expiresIn: '15m' });
};

export const verifyAccessToken = (token: string): AccessPayload => {
  return jwt.verify(token, SECRET) as AccessPayload;
};
