import { pool } from './db';

/**
 * Удаляет историю с проверкой прав доступа.
 * @param historyId - ID истории
 * @param userId - ID пользователя, который инициировал удаление
 * @param userRole - Роль пользователя ('ADMIN' или 'USER')
 */
export const deleteHistoryById = async (historyId: string, userId: string, userRole: string) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Проверяем существование истории и получаем её автора
    const checkRes = await client.query(`SELECT author_id FROM "History" WHERE id = $1`, [historyId]);

    if (checkRes.rowCount === 0) {
      throw new Error(`История с id=${historyId} не найдена`);
    }

    const historyAuthorId = checkRes.rows[0].author_id;

    // 2. Проверка прав: если не админ И не автор — запрещаем
    if (userRole !== 'ADMIN' && historyAuthorId !== userId) {
      throw new Error('У вас нет прав для удаления этой истории');
    }

    // 3. Удаляем историю
    // Дополнительно страхуемся в DELETE запросе условием (для не-админов)
    if (userRole === 'ADMIN') {
      await client.query(`DELETE FROM "History" WHERE id = $1`, [historyId]);
    } else {
      await client.query(`DELETE FROM "History" WHERE id = $1 AND author_id = $2`, [historyId, userId]);
    }

    await client.query('COMMIT');

    console.log(`✅ История ${historyId} успешно удалена пользователем ${userId}`);
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('🚨 Ошибка удаления истории:', error);
    throw error;
  } finally {
    client.release();
  }
};
