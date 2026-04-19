import { Router } from 'express';
import { authenticate } from '../middleware/auth'; // Оставляем только аутентификацию
import { deleteHistoryController } from '../controllers/historyDeleteController';

const router = Router();

// Контроллер сам решит, хватает ли прав на конкретный ID
router.delete('/history/:id', authenticate, deleteHistoryController);

export default router;
