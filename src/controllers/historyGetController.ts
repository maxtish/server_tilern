import { Request, Response, NextFunction } from 'express';
import { History } from '../types/hystory';
import { getAllHistories, getAllHistoriesWithUserLikes } from '../db/historyDB';

export const getHistoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.query.userId as string | undefined; // 🟢 берём из query-параметра
    let histories: History[];

    if (userId) {
      histories = await getAllHistoriesWithUserLikes(userId);
    } else {
      histories = await getAllHistories();
    }

    res.status(200).json(histories);
  } catch (error) {
    next(error);
  }
};
