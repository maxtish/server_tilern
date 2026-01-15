import { Request, Response, NextFunction } from 'express';
import { getHistoryByIdWithUserLikes } from '../db/historyDB';

export const getHistoryByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId as string | undefined;

    const history = await getHistoryByIdWithUserLikes(id, userId);

    if (!history) {
      return res.status(404).json({ message: 'History not found' });
    }

    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
};
