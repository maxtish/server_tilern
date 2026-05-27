import { Request, Response, NextFunction } from 'express';
import { translateWordWithGPT } from '../services/gpt/translateWordWithGPT';

export const translateWordController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, direction } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ error: 'Нет слова для перевода' });
    }

    if (direction !== 'de-ru' && direction !== 'ru-de') {
      return res.status(400).json({ error: 'Неверное направление перевода' });
    }

    const options = await translateWordWithGPT(text.trim(), direction);

    return res.json({ options });
  } catch (err) {
    next(err);
  }
};
