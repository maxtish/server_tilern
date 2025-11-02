import { Router } from 'express';
import { likeHistoryController, unlikeHistoryController } from '../controllers/historyLikeController';

const router = Router();

// ❤️ Поставить лайк
router.post('/history/like/:historyId', likeHistoryController);

// 💔 Убрать лайк
router.post('/history/unlike/:historyId', unlikeHistoryController);

export default router;
