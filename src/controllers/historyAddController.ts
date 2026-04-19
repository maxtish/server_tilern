import { Request, Response, NextFunction } from 'express';
import { buildHistory } from '../services/history/buildHistory';

export const submitHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { story } = req.body;
    // Данные из вашего JWT/Session middleware
    const user = (req as any).user;

    if (!story || !story.trim()) {
      return res.status(400).json({ error: 'История не введена' });
    }

    // Передаем объект пользователя в билд-сервис
    const generatedStory = await buildHistory(story, {
      id: user.id,
      name: user.name || 'User',
      role: user.role, // 'ADMIN' или 'USER'
    });

    res.json({ generatedStory });
  } catch (err) {
    next(err);
  }
};
