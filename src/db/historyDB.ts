import { pool } from './db';
import { History, mapHistoryToDB, mapDBToHistory, DBHistory } from '../types/hystory';
// --- Вставка новой истории
export const insertHistory = async (history: History): Promise<History> => {
  const client = await pool.connect();
  try {
    const dbStory: DBHistory = mapHistoryToDB(history);
    const query = `
      INSERT INTO "History" (
        id, title, description, full_story, language_level,
        image_url, audio_url, token_timing, words, sentences,
        created_at, updated_at, author_name, author_role,
        views_count
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *;
    `;
    const values = [
      dbStory.id,
      JSON.stringify(dbStory.title),
      dbStory.description,
      JSON.stringify(dbStory.full_story),
      dbStory.language_level,
      dbStory.image_url,
      dbStory.audio_url,
      JSON.stringify(dbStory.token_timing), // <-- СЕРИАЛИЗАЦИЯ
      JSON.stringify(dbStory.words), // <-- СЕРИАЛИЗАЦИЯ
      JSON.stringify(dbStory.sentences), // 🔹 СЕРИАЛИЗАЦИЯ МАССИВА ПРЕДЛОЖЕНИЙ
      dbStory.created_at,
      dbStory.updated_at,
      dbStory.author_name,
      dbStory.author_role,
      dbStory.views_count,
    ];
    const res = await client.query(query, values);
    return mapDBToHistory(res.rows[0]);
  } finally {
    client.release();
  }
};

// --- Поставить лайк
export const likeHistory = async (historyId: string, userId: string): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query(
      `
      INSERT INTO "HistoryLikes" (history_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (history_id, user_id) DO NOTHING
    `,
      [historyId, userId]
    );
  } finally {
    client.release();
  }
};

// --- Убрать лайк
export const unlikeHistory = async (historyId: string, userId: string): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query(
      `
      DELETE FROM "HistoryLikes" WHERE history_id=$1 AND user_id=$2
    `,
      [historyId, userId]
    );
  } finally {
    client.release();
  }
};

// --- Получить все истории с количеством лайков и флагом текущего пользователя
export const getAllHistoriesWithUserLikes = async (
  userId?: string,
  limit: number = 20,
  offset: number = 0
): Promise<History[]> => {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `
      SELECT 
        h.*,
        COALESCE(lc.likes_count, 0) AS likes_count,
        CASE WHEN hl.user_id IS NULL THEN FALSE ELSE TRUE END AS liked_by_current_user
      FROM "History" h
      LEFT JOIN (
        SELECT history_id, COUNT(*) AS likes_count
        FROM "HistoryLikes"
        GROUP BY history_id
      ) lc ON lc.history_id = h.id
      LEFT JOIN (
        SELECT history_id, user_id
        FROM "HistoryLikes"
        WHERE user_id = $1
      ) hl ON hl.history_id = h.id
      ORDER BY h.created_at DESC
      LIMIT $2 OFFSET $3; -- 🟢 Добавляем пагинацию
    `,
      [userId || null, limit, offset]
    );

    return res.rows.map((row) => {
      const history = mapDBToHistory(row);
      history.likesCount = parseInt(row.likes_count); // Важно: COUNT возвращает string в pg
      history.likedByCurrentUser = row.liked_by_current_user;
      return history;
    });
  } finally {
    client.release();
  }
};

// --- Получить все истории без пользователя
export const getAllHistories = async (): Promise<History[]> => {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT * FROM "History" ORDER BY created_at DESC');
    return res.rows.map(mapDBToHistory);
  } finally {
    client.release();
  }
};

// --- Получить количество лайков для истории
export const getLikesCount = async (historyId: string): Promise<number> => {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `
      SELECT COUNT(*)::int as count FROM "HistoryLikes" WHERE history_id=$1
    `,
      [historyId]
    );
    return res.rows[0]?.count || 0;
  } finally {
    client.release();
  }
};

export const getHistoryByIdWithUserLikes = async (historyId: string, userId?: string): Promise<History | null> => {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `
      SELECT 
        h.*,
        COALESCE(lc.likes_count, 0) AS likes_count,
        CASE WHEN hl.user_id IS NULL THEN FALSE ELSE TRUE END AS liked_by_current_user
      FROM "History" h
      LEFT JOIN (
        SELECT history_id, COUNT(*) AS likes_count
        FROM "HistoryLikes"
        GROUP BY history_id
      ) lc ON lc.history_id = h.id
      LEFT JOIN (
        SELECT history_id, user_id
        FROM "HistoryLikes"
        WHERE user_id = $2
      ) hl ON hl.history_id = h.id
      WHERE h.id = $1
      LIMIT 1;
      `,
      [historyId, userId || null]
    );

    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    const history = mapDBToHistory(row);
    history.likesCount = parseInt(row.likes_count);
    history.likedByCurrentUser = row.liked_by_current_user;

    return history;
  } finally {
    client.release();
  }
};
