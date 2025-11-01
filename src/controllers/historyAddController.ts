import { Request, Response, NextFunction } from 'express';
import { historyGetGPT } from '../services/gptHistoryGet';

// POST — получаем историю из формы и запускаем GPT
export const submitHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { story } = req.body;

    if (!story || !story.trim()) {
      return res.status(400).json({ error: 'История не введена' });
    }

    // Передаем введённый текст в historyGetGPT
    const generatedStory = await historyGetGPT(story);

    res.json({ generatedStory });
  } catch (err) {
    next(err); // передаем в централизованный error handler
  }
};
