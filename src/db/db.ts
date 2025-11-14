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

    // --- Таблица историй
    await client.query(`
   CREATE TABLE IF NOT EXISTS "History" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title JSONB NOT NULL,
  description TEXT,
  full_story JSONB NOT NULL,
  language_level TEXT CHECK (language_level IN ('A1','A2','B1','B2','C1','C2')),
  image_url TEXT,
  audio_url TEXT,
  word_timing JSONB,
  words JSONB,
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

    // --- Таблица сохранённых слов пользователя
    // таблица
    await client.query(`
  CREATE TABLE IF NOT EXISTS "UserWords" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
    history_id UUID REFERENCES "History"(id) ON DELETE SET NULL,
    word JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );
`);

    // уникальный индекс
    await client.query(`
  CREATE UNIQUE INDEX IF NOT EXISTS userwords_unique_word_idx
  ON "UserWords"(user_id, (word->>'word'));
`);
    console.log('✅ UserWords table is ready');

    // --- Проверка и создание админа
    const res = await client.query('SELECT * FROM "User" WHERE email=$1', ['admin']);
    if (res.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin', 10);
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

    // --- Проверка и создание тестового пользователя
    const userRes = await client.query('SELECT * FROM "User" WHERE email=$1', ['user']);
    if (userRes.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('user', 10);
      await client.query('INSERT INTO "User"(email, password_hash, name, role) VALUES($1,$2,$3,$4)', [
        'user',
        hashedPassword,
        'User',
        'USER',
      ]);
      console.log('✅ Test user created: user / user');
    } else {
      console.log('ℹ️ Test user already exists');
    }
  } finally {
    client.release();
  }

  // --- Создание дополнительных админов
  const adminsToCreate = [
    { email: 'marina', password: 'marina', name: 'Marina' },
    { email: 'wowa', password: 'wowa', name: 'Wowa' },
    { email: 'max', password: 'max', name: 'Max' },
  ];

  for (const admin of adminsToCreate) {
    const existing = await client.query('SELECT * FROM "User" WHERE email=$1', [admin.email]);

    if (existing.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(admin.password, 10);
      await client.query('INSERT INTO "User"(email, password_hash, name, role) VALUES($1,$2,$3,$4)', [
        admin.email,
        hashedPassword,
        admin.name,
        'ADMIN',
      ]);
      console.log(`✅ Admin user created: ${admin.email} / ${admin.password}`);
    } else {
      console.log(`ℹ️ Admin user already exists: ${admin.email}`);
    }
  }
};
