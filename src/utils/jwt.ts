import jwt, { JwtPayload } from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'supersecret';

interface MyPayload {
  id: number;
  role: string;
}

// Генерация токена
export const signToken = (payload: MyPayload) => {
  return jwt.sign(payload, SECRET, { expiresIn: '1h' });
};

// Проверка токена
export const verifyToken = (token: string): MyPayload => {
  try {
    return jwt.verify(token, SECRET) as MyPayload;
  } catch (err) {
    throw new Error('Invalid token');
  }
};
