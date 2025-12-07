import { pool } from './db';

export const deleteHistoryById = async (historyId: string) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Проверяем, есть ли история
    const historyRes = await client.query(`SELECT id FROM "History" WHERE id = $1`, [historyId]);

    if (historyRes.rowCount === 0) {
      throw new Error(`История с id=${historyId} не найдена`);
    }

    // Удаляем историю
    await client.query(`DELETE FROM "History" WHERE id = $1`, [historyId]);

    // Likes удалятся через ON DELETE CASCADE
    // UserWords -> history_id станет NULL через SET NULL

    await client.query('COMMIT');

    console.log(`✅ История ${historyId} успешно удалена из базы`);
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('🚨 Ошибка удаления истории из базы:', error);
    throw error;
  } finally {
    client.release();
  }
};
