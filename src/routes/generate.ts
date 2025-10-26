import { Router } from 'express';
import { generateMotorcycle } from '../controllers/generateController';

const router = Router();
router.get('/', generateMotorcycle); // GET-запрос для генерации статьи
export default router;
