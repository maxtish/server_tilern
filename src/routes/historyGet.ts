import { Router } from 'express';
import { getHistoryController } from '../controllers/historyGetController';
import { getHistoryByIdController } from '../controllers/historyGetByIdController';

const router = Router();
router.get('/history', getHistoryController); // GET-запрос для генерации статьи
router.get('/history/:id', getHistoryByIdController); // по id истории
export default router;
