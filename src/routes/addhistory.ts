import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { submitHistory } from '../controllers/historyAddController';

const router = Router();

// POST /history — только для админа
router.post('/history', authenticate, authorize('ADMIN'), submitHistory);

export default router;
