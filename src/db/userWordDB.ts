// src/api/userWords.ts
import { pool } from './db';
import { DBUserWord, mapDBToUserWord, mapUserWordToDB, UserWord } from '../types/hystory';

// --- Создание уникального индекса (если его ещё нет)
export const ensureUserWordsIndex = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS userwords_unique_word_idx
      ON "UserWords"(user_id, (word->>'word'));
    `);
    console.log('✅ Unique index for UserWords is ready');
  } finally {
    client.release();
  }
};

// --- Добавить слово пользователя
export const saveUserWord = async (userWord: UserWord): Promise<UserWord | null> => {
  const client = await pool.connect();
  try {
    const dbWord = mapUserWordToDB({
      ...userWord,
      createdAt: new Date().toISOString(),
    });

    // Вставка с обработкой конфликта через индекс
    const result = await client.query<DBUserWord>(
      `
      INSERT INTO "UserWords" (user_id, history_id, word, created_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT DO NOTHING
      RETURNING *;
    `,
      [dbWord.user_id, dbWord.history_id, dbWord.word, dbWord.created_at]
    );

    if (result.rows.length === 0) return null; // слово уже существует
    return mapDBToUserWord(result.rows[0]);
  } catch (err) {
    console.error('🚨 Error saving user word:', err);
    throw err;
  } finally {
    client.release();
  }
};

// --- Получить все слова пользователя
export const getUserWordsByUser = async (userId: string): Promise<UserWord[]> => {
  const client = await pool.connect();
  try {
    const result = await client.query<DBUserWord>(
      `SELECT * FROM "UserWords" WHERE user_id = $1 ORDER BY created_at DESC;`,
      [userId]
    );
    return result.rows.map(mapDBToUserWord);
  } catch (err) {
    console.error('🚨 Error fetching user words:', err);
    throw err;
  } finally {
    client.release();
  }
};

// --- Удалить слово пользователя
export const deleteUserWord = async (userId: string, word: string): Promise<boolean> => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `
      DELETE FROM "UserWords"
      WHERE user_id = $1 AND (word->>'word') = $2;
    `,
      [userId, word]
    );
    return (result.rowCount ?? 0) > 0;
  } catch (err) {
    console.error('🚨 Error deleting user word:', err);
    throw err;
  } finally {
    client.release();
  }
};
