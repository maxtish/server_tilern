import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { submitHistory } from '../controllers/historyAddController';

const router = Router();

// Теперь доступ есть у всех авторизованных пользователей
router.post('/history', authenticate, submitHistory);

export default router;
