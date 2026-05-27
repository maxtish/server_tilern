import { Router } from 'express';
import { authenticate } from '../middleware/auth'; // Импортируем вашу middleware
import { translateWordController } from '../controllers/translateWordWithGPT';

const router = Router();

router.post('/words/translate', authenticate, translateWordController);

export default router;
