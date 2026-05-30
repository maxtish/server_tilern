export type UserRole = 'USER' | 'PREMIUM' | 'EDITOR' | 'ADMIN';

export interface AuthUser {
  id: string;
  role: UserRole;
  sessionId?: string;
  email?: string;
  name?: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}
