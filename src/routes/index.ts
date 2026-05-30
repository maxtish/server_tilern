import { Router } from 'express';
import addHistoryRouter from './addhistory';
import historyRouter from './historyGet';
import historyLikeRouter from './historyLikeRoutes';
import userWordRoutes from './userWordRoutes';
import deleteHistoryRoutes from './deleteHistoryRoutes';
import submitGPTHistory from './generateHistory';
import translateRouter from './translate';
import auth from './auth';

const router = Router();

router.use(addHistoryRouter);
router.use(historyRouter);
router.use('/auth', auth);
router.use(historyLikeRouter);
router.use(userWordRoutes);
router.use(deleteHistoryRoutes);
router.use(submitGPTHistory);
router.use(translateRouter);

export default router;
