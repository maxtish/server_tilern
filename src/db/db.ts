import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const testDB = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to Postgres!');
    client.release();
  } catch (err) {
    console.error('🚨 Postgres connection error:', err);
    process.exit(1);
  }
};

export const initDB = async () => {
  const client = await pool.connect();
  try {
    // Создание таблицы пользователей
    await client.query(`
      CREATE TABLE IF NOT EXISTS "User" (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE,
        password_hash TEXT,
        google_id TEXT UNIQUE,
        name TEXT,
        avatar_url TEXT,
        role TEXT DEFAULT 'USER',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Users table is ready');

    // Проверяем, есть ли админ
    const res = await client.query('SELECT * FROM "User" WHERE email=$1', ['admin']);
    if (res.rows.length === 0) {
      // Хешируем пароль
      const hashedPassword = await bcrypt.hash('admin', 10);

      // Создаём админ-пользователя
      await client.query('INSERT INTO "User"(email, password_hash, name, role) VALUES($1,$2,$3,$4)', [
        'admin',
        hashedPassword,
        'Administrator',
        'ADMIN',
      ]);
      console.log('✅ Admin user created: admin / admin');
    } else {
      console.log('ℹ️ Admin user already exists');
    }
  } finally {
    client.release();
  }
};
