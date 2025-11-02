import { Request, Response } from 'express';
import { likeHistory, unlikeHistory, getAllHistoriesWithUserLikes, getLikesCount } from '../db/historyDB';

// ❤️ Поставить лайк
export const likeHistoryController = async (req: Request, res: Response) => {
  try {
    const { historyId } = req.params;
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ error: 'userId is required' });

    await likeHistory(historyId, userId);
    const likesCount = await getLikesCount(historyId);

    res.json({ success: true, likesCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to like history' });
  }
};

// 💔 Убрать лайк
export const unlikeHistoryController = async (req: Request, res: Response) => {
  try {
    const { historyId } = req.params;
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ error: 'userId is required' });

    await unlikeHistory(historyId, userId);
    const likesCount = await getLikesCount(historyId);

    res.json({ success: true, likesCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to unlike history' });
  }
};

// 🟢 Получить все истории с отметкой лайков текущего пользователя
export const getHistoryController = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string | undefined;
    const histories = await getAllHistoriesWithUserLikes(userId);
    res.status(200).json(histories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get histories' });
  }
};
