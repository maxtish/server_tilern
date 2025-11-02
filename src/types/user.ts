// src/types/user.ts

import { UserRole } from './express';

// --- Серверная модель (из БД) ---
export interface DBUser {
  id: string;
  email: string;
  password_hash: string | null;
  google_id: string | null;
  name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// --- Клиентская модель (для API / фронта) ---
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
}

// --- Маппер: DB → API (server response) ---
export const mapDBUserToUser = (dbUser: DBUser): User => ({
  id: dbUser.id,
  email: dbUser.email,
  name: dbUser.name,
  avatarUrl: dbUser.avatar_url,
  role: dbUser.role,
});
