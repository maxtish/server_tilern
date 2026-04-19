import { Request, Response } from 'express';
import { likeHistory, unlikeHistory, getAllHistoriesWithUserLikes, getLikesCount } from '../db/historyDB';

// ❤️ Поставить лайк
export const likeHistoryController = async (req: Request, res: Response) => {
  try {
    const { historyId } = req.params;

    // 🔒 Берем ID строго из токена
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await likeHistory(historyId, userId);

    // Получаем актуальное кол-во лайков после изменения
    const likesCount = await getLikesCount(historyId);

    res.json({ success: true, likesCount });
  } catch (err) {
    console.error('🚨 Like error:', err);
    res.status(500).json({ error: 'Failed to like history' });
  }
};

// 💔 Убрать лайк
export const unlikeHistoryController = async (req: Request, res: Response) => {
  try {
    const { historyId } = req.params;

    // 🔒 Берем ID строго из токена
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await unlikeHistory(historyId, userId);

    const likesCount = await getLikesCount(historyId);

    res.json({ success: true, likesCount });
  } catch (err) {
    console.error('🚨 Unlike error:', err);
    res.status(500).json({ error: 'Failed to unlike history' });
  }
};

// 🟢 Получить все истории (свои + публичные)
export const getHistoryController = async (req: Request, res: Response) => {
  try {
    // 🔒 Берем ID из токена для фильтрации "свои + публичные" в БД
    const userId = req.user?.id;

    // Важно: если ваша authenticateMiddleware опциональна,
    // userId может быть undefined, и getAllHistoriesWithUserLikes вернет только публичные.
    const histories = await getAllHistoriesWithUserLikes(userId);

    res.status(200).json(histories);
  } catch (err) {
    console.error('🚨 Get histories error:', err);
    res.status(500).json({ error: 'Failed to get histories' });
  }
};
