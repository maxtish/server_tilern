import { Router } from 'express';
import { authenticateOptional } from '../middleware/auth';
import { getHistoryController } from '../controllers/historyGetController';
import { getHistoryByIdController } from '../controllers/historyGetByIdController';

const router = Router();

// GET /history (Список)
// Сюда пустит и гостя, и юзера.
// Но внутри контроллера req.user будет либо с данными, либо undefined.
router.get('/history', authenticateOptional, getHistoryController);

router.get('/history/:id', authenticateOptional, getHistoryByIdController);

export default router;
