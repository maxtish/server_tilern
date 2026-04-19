import { Router } from 'express';
import { authenticate } from '../middleware/auth'; // Импортируем вашу middleware
import { likeHistoryController, unlikeHistoryController } from '../controllers/historyLikeController';

const router = Router();

// ❤️ Поставить лайк — теперь строго через authenticate
router.post('/history/like/:historyId', authenticate, likeHistoryController);

// 💔 Убрать лайк — теперь строго через authenticate
router.post('/history/unlike/:historyId', authenticate, unlikeHistoryController);

export default router;
