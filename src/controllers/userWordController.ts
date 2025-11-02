import { Request, Response } from 'express';
import { saveUserWord, getUserWordsByUser, deleteUserWord } from '../db/userWordDB';
import { UserWord } from '../types/hystory';

// 💾 Сохранить слово
export const saveUserWordController = async (req: Request, res: Response) => {
  try {
    const { userId, historyId, word } = req.body;

    if (!userId || !word) {
      return res.status(400).json({ success: false, error: 'userId и word обязательны' });
    }

    const newWord: UserWord = {
      id: '', // БД создаст UUID
      userId,
      historyId: historyId ?? null,
      word,
      createdAt: new Date().toISOString(),
    };

    const saved = await saveUserWord(newWord);
    if (!saved) {
      return res.status(200).json({ success: false, message: 'Слово уже сохранено' });
    }

    res.status(201).json({ success: true, word: saved });
  } catch (err) {
    console.error('🚨 Error saving user word:', err);
    res.status(500).json({ success: false, error: 'Failed to save user word' });
  }
};

// 📚 Получить все слова пользователя
export const getUserWordsController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ success: false, error: 'userId обязателен' });

    const words = await getUserWordsByUser(userId);
    res.status(200).json({ success: true, words });
  } catch (err) {
    console.error('🚨 Error fetching user words:', err);
    res.status(500).json({ success: false, error: 'Failed to get user words' });
  }
};

// ❌ Удалить слово
export const deleteUserWordController = async (req: Request, res: Response) => {
  try {
    const { userId, word } = req.body;
    if (!userId || !word) {
      return res.status(400).json({ success: false, error: 'userId и word обязательны' });
    }

    const deleted = await deleteUserWord(userId, word);
    res.status(200).json({ success: deleted });
  } catch (err) {
    console.error('🚨 Error deleting user word:', err);
    res.status(500).json({ success: false, error: 'Failed to delete user word' });
  }
};
