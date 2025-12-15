import { Request, Response, NextFunction } from 'express';
import { buildGPTHistory } from '../services/gpt/generatedHystory';

export const submitGPTHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { story } = req.body;

    if (!story || !story.trim()) {
      return res.status(400).json({ error: 'История не введена' });
    }

    // Вызываем сервис, который делает всю работу с GPT
    const generatedHistory = await buildGPTHistory(story.trim());

    res.json({ generatedHistory });
  } catch (err) {
    next(err); // передаем в централизованный error handler
  }
};
