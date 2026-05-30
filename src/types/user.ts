import { UserRole } from './express';

export interface DBUser {
  id: string;
  email: string;
  password_hash: string | null;
  google_id: string | null;
  name: string | null;
  avatar_url: string | null;
  role: UserRole;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  email_verified: boolean;
}

export const mapDBUserToUser = (dbUser: DBUser): User => ({
  id: dbUser.id,
  email: dbUser.email,
  name: dbUser.name,
  avatarUrl: dbUser.avatar_url,
  role: dbUser.role,
  email_verified: Boolean(dbUser.email_verified),
});
