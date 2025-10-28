import { Router } from 'express';
import addHistoryRouter from './addhistory';
import historyRouter from './historyGet';

const router = Router();

// Подключаем все роуты
router.use(addHistoryRouter);
router.use(historyRouter);

export default router;
