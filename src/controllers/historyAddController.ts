import { Request, Response, NextFunction } from 'express';
import { buildHistory } from '../services/history/buildHistory';

// POST — получаем историю из формы и запускаем GPT
export const submitHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { story } = req.body;

    if (!story || !story.trim()) {
      return res.status(400).json({ error: 'История не введена' });
    }

    // Передаем введённый текст в historyGetGPT
    const generatedStory = await buildHistory(story);

    res.json({ generatedStory });
  } catch (err) {
    next(err); // передаем в централизованный error handler
  }
};
