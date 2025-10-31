import { Router } from 'express';
import addHistoryRouter from './addhistory';
import historyRouter from './historyGet';
import auth from './auth';

const router = Router();

// Подключаем все роуты
router.use(addHistoryRouter);
router.use(historyRouter);
router.use('/auth', auth);
export default router;
