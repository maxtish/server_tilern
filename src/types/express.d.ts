// src/types/express.d.ts
import { Request } from 'express';

// Определяем допустимые роли
export type UserRole = 'USER' | 'PREMIUM' | 'EDITOR' | 'ADMIN';

// Интерфейс для пользователя, который будет храниться в req.user
export interface AuthUser {
  id: number;
  role: UserRole;
  email?: string;
  name?: string;
}

// Расширяем Request, чтобы добавить поле user
declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}
