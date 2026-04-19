import { Request, Response, NextFunction } from 'express';
import { getAllHistoriesWithUserLikes } from '../db/historyDB';

export const getHistoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 🔒 БЕРЕМ ИЗ ТОКЕНА (через middleware), А НЕ ИЗ QUERY
    // Если пользователь не залогинен, userId будет undefined
    const userId = req.user?.id;

    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    // Наша функция в БД уже содержит логику:
    // WHERE is_public = true OR author_id = $1
    // Если userId — undefined, $1 будет null, и вернутся ТОЛЬКО публичные (админские) истории.
    const histories = await getAllHistoriesWithUserLikes(userId, limit, offset);

    res.status(200).json(histories);
  } catch (error) {
    next(error);
  }
};
