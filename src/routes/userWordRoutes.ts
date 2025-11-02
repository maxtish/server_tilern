import { Router } from 'express';
import {
  deleteUserWordController,
  getUserWordsController,
  saveUserWordController,
} from '../controllers/userWordController';

const router = Router();

// 💾 Сохранить слово
router.post('/user/word', saveUserWordController);

// 📚 Получить все сохранённые слова пользователя
router.get('/user/words/:userId', getUserWordsController);

// ❌ Удалить сохранённое слово
router.delete('/user/word', deleteUserWordController);

export default router;
