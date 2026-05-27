import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { translateWordController } from '../controllers/translateWordWithGPTController';

const router = Router();

router.post('/words/translate', authenticate, translateWordController);

export default router;
