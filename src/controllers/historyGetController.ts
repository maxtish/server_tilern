import { Request, Response, NextFunction } from 'express';

import { History } from '../types/hystory';
import { getAllHistories } from '../db/historyDB';

export const getHistoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history: History[] = await getAllHistories();

    res.send(history);
  } catch (error) {
    next(error); // передаем в централизованный error handler
  }
};
