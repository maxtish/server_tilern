import { pool } from './db';
import { History, mapHistoryToDB, mapDBToHistory, DBHistory } from '../types/hystory';

// --- 1️⃣ Вставка новой истории ---
export const insertHistory = async (history: History): Promise<History> => {
  const client = await pool.connect();
  try {
    const dbHistory = mapHistoryToDB(history);

    const query = `
      INSERT INTO "History" (
        id, title, description, full_story, language_level,
        image_url, audio_url, word_timing, words,
        created_at, updated_at, author_name, author_role,
        views_count, likes_count
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *;
    `;

    const values = [
      dbHistory.id,
      dbHistory.title,
      dbHistory.description,
      dbHistory.full_story,
      dbHistory.language_level,
      dbHistory.image_url,
      dbHistory.audio_url,
      dbHistory.word_timing,
      dbHistory.words,
      dbHistory.created_at,
      dbHistory.updated_at,
      dbHistory.author_name,
      dbHistory.author_role,
      dbHistory.views_count,
      dbHistory.likes_count,
    ];

    const res = await client.query(query, values);
    return mapDBToHistory(res.rows[0]);
  } finally {
    client.release();
  }
};

// --- 2️⃣ Получение всех историй ---
export const getAllHistories = async (): Promise<History[]> => {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT * FROM "History" ORDER BY created_at DESC');
    return res.rows.map(mapDBToHistory);
  } finally {
    client.release();
  }
};

// --- 3️⃣ Получение истории по ID ---
export const getHistoryById = async (id: string): Promise<History | null> => {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT * FROM "History" WHERE id=$1', [id]);
    if (!res.rows[0]) return null;
    return mapDBToHistory(res.rows[0]);
  } finally {
    client.release();
  }
};

// --- 4️⃣ Обновление выбранных полей истории ---
export const updateHistory = async (
  id: string,
  updates: Partial<Pick<History, 'title' | 'description' | 'fullStory' | 'languageLevel' | 'words'>>
): Promise<History | null> => {
  const client = await pool.connect();
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (updates.title) {
      fields.push(`title = $${idx++}`);
      values.push(updates.title);
    }
    if (updates.description) {
      fields.push(`description = $${idx++}`);
      values.push(updates.description);
    }
    if (updates.fullStory?.ru) {
      fields.push(`full_story = jsonb_set(full_story, '{ru}', to_jsonb($${idx++}::text))`);
      values.push(updates.fullStory.ru);
    }
    if (updates.languageLevel) {
      fields.push(`language_level = $${idx++}`);
      values.push(updates.languageLevel);
    }
    if (updates.words) {
      fields.push(`words = $${idx++}`);
      values.push(updates.words);
    }

    if (fields.length === 0) return getHistoryById(id);

    // обновление даты
    fields.push(`updated_at = NOW()`);

    const query = `UPDATE "History" SET ${fields.join(', ')} WHERE id=$${idx} RETURNING *`;
    values.push(id);

    const res = await client.query(query, values);
    if (!res.rows[0]) return null;
    return mapDBToHistory(res.rows[0]);
  } finally {
    client.release();
  }
};

// --- 5️⃣ Увеличение счетчика просмотров ---
export const incrementViews = async (id: string): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('UPDATE "History" SET views_count = views_count + 1 WHERE id=$1', [id]);
  } finally {
    client.release();
  }
};

// --- 6️⃣ Обновление количества лайков ---
// --- 1️⃣ Поставить лайк ---
export const likeHistory = async (historyId: string, userId: string): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query(
      `
      INSERT INTO "HistoryLikes" (history_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (history_id, user_id) DO NOTHING;
      `,
      [historyId, userId]
    );

    // Обновляем кэш количества лайков в таблице History
    await client.query(
      `UPDATE "History"
       SET likes_count = (SELECT COUNT(*) FROM "HistoryLikes" WHERE history_id=$1)
       WHERE id=$1`,
      [historyId]
    );
  } finally {
    client.release();
  }
};

// --- 2️⃣ Убрать лайк ---
export const unlikeHistory = async (historyId: string, userId: string): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query(`DELETE FROM "HistoryLikes" WHERE history_id=$1 AND user_id=$2`, [historyId, userId]);

    // Обновляем кэш количества лайков
    await client.query(
      `UPDATE "History"
       SET likes_count = (SELECT COUNT(*) FROM "HistoryLikes" WHERE history_id=$1)
       WHERE id=$1`,
      [historyId]
    );
  } finally {
    client.release();
  }
};

// --- 3️⃣ Получить все истории, лайкнутые пользователем ---
export const getUserLikedHistories = async (userId: string): Promise<string[]> => {
  const client = await pool.connect();
  try {
    const res = await client.query(`SELECT history_id FROM "HistoryLikes" WHERE user_id=$1`, [userId]);
    return res.rows.map((row) => row.history_id);
  } finally {
    client.release();
  }
};

// --- 4️⃣ Получить количество лайков для истории ---
export const getLikesCount = async (historyId: string): Promise<number> => {
  const client = await pool.connect();
  try {
    const res = await client.query(`SELECT COUNT(*)::int as count FROM "HistoryLikes" WHERE history_id=$1`, [
      historyId,
    ]);
    return res.rows[0]?.count || 0;
  } finally {
    client.release();
  }
};

// --- 🟢 Получить все истории и отметим, какие истории лайкнул юзер
export const getAllHistoriesUserID = async (userId?: string): Promise<History[]> => {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT * FROM "History" ORDER BY created_at DESC');
    const histories = res.rows.map((row) => mapDBToHistory(row));

    if (userId) {
      // отметим, какие истории лайкнул юзер
      const liked = await client.query('SELECT history_id FROM "HistoryLikes" WHERE user_id = $1', [userId]);
      const likedSet = new Set(liked.rows.map((r) => r.history_id));
      histories.forEach((h) => (h.likedByCurrentUser = likedSet.has(h.id)));
    }

    return histories;
  } finally {
    client.release();
  }
};

// --- 🟡 Сохранение истории в базу
export const saveHistoryToDB = async (story: History): Promise<void> => {
  const dbStory: DBHistory = mapHistoryToDB(story);
  const client = await pool.connect();
  try {
    await client.query(
      `
      INSERT INTO "History" 
      (id, title, description, full_story, language_level, image_url, audio_url, word_timing, words,
       created_at, updated_at, author_name, author_role, views_count, likes_count)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      `,
      [
        dbStory.id,
        dbStory.title,
        dbStory.description,
        dbStory.full_story,
        dbStory.language_level,
        dbStory.image_url,
        dbStory.audio_url,
        JSON.stringify(dbStory.word_timing),
        JSON.stringify(dbStory.words),
        dbStory.created_at,
        dbStory.updated_at,
        dbStory.author_name,
        dbStory.author_role,
        dbStory.views_count,
        dbStory.likes_count,
      ]
    );
  } finally {
    client.release();
  }
};
