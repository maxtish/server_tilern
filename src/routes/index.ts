import { Router } from 'express';
import addHistoryRouter from './addhistory';
import historyRouter from './historyGet';
import historyLikeRouter from './historyLikeRoutes';
import auth from './auth';

const router = Router();

// Подключаем все роуты
router.use(addHistoryRouter);
router.use(historyRouter);
router.use('/auth', auth);
router.use(historyLikeRouter);
export default router;
