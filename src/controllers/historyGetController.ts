import { Request, Response, NextFunction } from 'express';
import { readHistory } from '../services/gptHistoryGet';
import { History } from '../types/hystory';

export const getHistoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history: History[] = readHistory();
    res.send(history);
  } catch (error) {
    next(error); // передаем в централизованный error handler
  }
};
