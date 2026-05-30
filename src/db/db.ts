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

    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "User" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE,
        password_hash TEXT,
        google_id TEXT UNIQUE,
        email_verified BOOLEAN DEFAULT false,
        name TEXT,
        avatar_url TEXT,
        role TEXT DEFAULT 'USER',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE "User"
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
    `);

    await client.query(`
      ALTER TABLE "User"
      ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;
    `);

    await client.query(`
      ALTER TABLE "User"
      ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    `);

    console.log('✅ User table is ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS "EmailVerificationToken" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        token_hash TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ EmailVerificationToken table is ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        token_hash TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ PasswordResetToken table is ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS "SecurityAuditLog" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES "User"(id) ON DELETE SET NULL,
        event_type TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ SecurityAuditLog table is ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS "RefreshToken" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        token_hash TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        revoked BOOLEAN DEFAULT false,
        revoked_at TIMESTAMP,
        device_info TEXT,
        user_agent TEXT,
        ip_address TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        last_used_at TIMESTAMP
      );
    `);

    console.log('✅ RefreshToken table is ready');

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

    const adminEmail = process.env.ADMIN_EMAIL || 'rd-max@ya.ru';
    const adminPassword = process.env.ADMIN_PASSWORD || '123456';

    const existingAdmin = await client.query('SELECT id FROM "User" WHERE email = $1', [adminEmail]);

    if (existingAdmin.rows.length === 0) {
      if (!adminPassword) {
        console.warn('⚠️ ADMIN_PASSWORD не задан. Admin user не создан.');
      } else {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        await client.query(
          `
          INSERT INTO "User"
            (email, password_hash, name, role, email_verified)
          VALUES
            ($1, $2, $3, $4, true)
          `,
          [adminEmail, hashedPassword, 'Administrator', 'ADMIN'],
        );

        console.log(`✅ Admin created: ${adminEmail}`);
      }
    } else {
      console.log(`ℹ️ Admin already exists: ${adminEmail}`);
    }
  } catch (err) {
    console.error('❌ Database initialization failed:', err);
  } finally {
    client.release();
    console.log('ℹ️ Client released');
  }
};
