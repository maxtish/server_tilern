import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { submitGPTHistory } from '../controllers/historyGenerateController';

const router = Router();

// POST /history/generate — генерация истории, только для админа
router.post('/history/generate', authenticate, authorize('ADMIN'), submitGPTHistory);

export default router;
