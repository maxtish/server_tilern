import { Request, Response, NextFunction } from 'express';
import { History } from '../types/hystory';
import { getAllHistories, getAllHistoriesWithUserLikes } from '../db/historyDB';

export const getHistoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.query.userId as string | undefined;
    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    // Вызываем обновленную функцию
    const histories = await getAllHistoriesWithUserLikes(userId, limit, offset);

    res.status(200).json(histories);
  } catch (error) {
    next(error);
  }
};
