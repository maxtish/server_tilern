import { Request, Response, NextFunction } from 'express';
import { getHistoryByIdWithUserLikes } from '../db/historyDB';

export const getHistoryByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // 🔒 БЕРЕМ ID ИЗ ТОКЕНА, А НЕ ИЗ QUERY
    // Если пользователь не авторизован (гость), userId будет undefined
    // (при условии, что на этом роуте нет обязательной authenticate, либо она опциональна)
    const userId = req.user?.id;

    const history = await getHistoryByIdWithUserLikes(id, userId);

    if (!history) {
      // Благодаря нашему условию в SQL (is_public = true OR author_id = $2),
      // если история чужая и приватная, база вернет null.
      // Пользователь получит 404, даже не узнав, что такая история существует.
      return res.status(404).json({ message: 'History not found or access denied' });
    }

    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
};
