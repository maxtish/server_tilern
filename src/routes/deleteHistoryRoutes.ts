import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { deleteHistoryController } from '../controllers/historyDeleteController';

const router = Router();

// DELETE /history/:id — только для админа
router.delete('/history/:id', authenticate, authorize('ADMIN'), deleteHistoryController);

export default router;
