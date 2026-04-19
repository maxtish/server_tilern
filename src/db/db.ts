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
    console.log('✅ НАЧИНАЮ ИНИЦИАЛИЗАЦИЮ БАЗЫ ДАННЫХ');

    // --- Таблица пользователей
    await client.query(`
      CREATE TABLE IF NOT EXISTS "User" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

    // --- Таблица Refresh токенов
    await client.query(`
      CREATE TABLE IF NOT EXISTS "RefreshToken" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
        token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        revoked BOOLEAN DEFAULT false,
        device_info TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ RefreshToken table is ready');

    // --- Таблица историй (с разделением прав доступа)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "History" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        author_id UUID REFERENCES "User"(id) ON DELETE CASCADE, 
        is_public BOOLEAN DEFAULT false, 
        title JSONB NOT NULL,
        description TEXT,
        full_story JSONB NOT NULL,
        language_level TEXT CHECK (language_level IN ('A1','A2','B1','B2','C1','C2')),
        image_url TEXT,
        audio_url TEXT,
        token_timing JSONB,
        words JSONB,
        sentences JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        author_name TEXT,
        author_role TEXT,
        views_count INT DEFAULT 0
      );
    `);
    console.log('✅ History table is ready');

    // --- Таблица лайков
    await client.query(`
      CREATE TABLE IF NOT EXISTS "HistoryLikes" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        history_id UUID REFERENCES "History"(id) ON DELETE CASCADE,
        user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(history_id, user_id)
      );
    `);
    console.log('✅ HistoryLikes table is ready');

    // --- Таблица сохранённых слов
    await client.query(`
      CREATE TABLE IF NOT EXISTS "UserWords" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
        history_id UUID REFERENCES "History"(id) ON DELETE SET NULL,
        word JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS userwords_unique_word_idx
      ON "UserWords"(user_id, (word->>'word'));
    `);
    console.log('✅ UserWords table is ready');

    // --- Создание пользователей (Админы и Тестовый юзер)
    const initialUsers = [
      { email: 'admin', pass: 'admin', name: 'Administrator', role: 'ADMIN' },
      { email: 'user', pass: 'user', name: 'User', role: 'USER' },
      { email: 'marina', pass: 'marina', name: 'Marina', role: 'USER' },
      { email: 'wowa', pass: 'wowa', name: 'Wowa', role: 'USER' },
      { email: 'max', pass: 'max', name: 'Max', role: 'USER' },
    ];

    for (const u of initialUsers) {
      const existing = await client.query('SELECT id FROM "User" WHERE email=$1', [u.email]);
      if (existing.rows.length === 0) {
        const hashedPassword = await bcrypt.hash(u.pass, 10);
        await client.query('INSERT INTO "User"(email, password_hash, name, role) VALUES($1,$2,$3,$4)', [
          u.email,
          hashedPassword,
          u.name,
          u.role,
        ]);
        console.log(`✅ User created: ${u.email} (${u.role})`);
      } else {
        console.log(`ℹ️ User already exists: ${u.email}`);
      }
    }
  } catch (err) {
    console.error('❌ Database initialization failed:', err);
  } finally {
    // Важно: закрываем клиент только здесь, когда ВСЕ операции завершены
    client.release();
    console.log('ℹ️ Client released');
  }
};
