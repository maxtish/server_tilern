import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { submitHistory } from '../controllers/historyAddController';
import { getHistoryJobStatus } from '../controllers/getHistoryJobStatus';

const router = Router();

// Теперь доступ есть у всех авторизованных пользователей
router.post('/history', authenticate, submitHistory);
router.get('/history/jobs/:jobId', authenticate, getHistoryJobStatus);

export default router;
