import { Router } from 'express';
import addHistoryRouter from './addhistory';
import historyRouter from './historyGet';
import historyLikeRouter from './historyLikeRoutes';
import userWordRoutes from './userWordRoutes';
import deleteHistoryRoutes from './deleteHistoryRoutes';
import submitGPTHistory from './generateHistory';
import auth from './auth';

const router = Router();

// Подключаем все роуты
router.use(addHistoryRouter);
router.use(historyRouter);
router.use('/auth', auth);
router.use(historyLikeRouter);
router.use(userWordRoutes);
router.use(deleteHistoryRoutes);
router.use(submitGPTHistory);
export default router;
