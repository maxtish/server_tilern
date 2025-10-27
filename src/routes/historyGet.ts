import { Router } from 'express';
import { generateNews } from '../controllers/historyGetController';

const router = Router();
router.get('/', generateNews); // GET-запрос для генерации статьи
export default router;
