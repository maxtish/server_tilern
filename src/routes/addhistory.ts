import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { submitHistory, getMyHistoryJobs, getHistoryJobStatus } from '../controllers/historyAddController';

const router = Router();

router.post('/history', authenticate, submitHistory);
router.get('/history/jobs', authenticate, getMyHistoryJobs);
router.get('/history/jobs/:jobId', authenticate, getHistoryJobStatus);

export default router;
