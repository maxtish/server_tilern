import { Router } from 'express';
import { getHistoryController } from '../controllers/historyGetController';

const router = Router();
router.get('/history', getHistoryController); // GET-запрос для генерации статьи
export default router;
