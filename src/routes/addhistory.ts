import { Router } from 'express';
import { showAddHistoryForm, submitHistory } from '../controllers/historyAddController';

const router = Router();

// GET — показать форму
router.get('/addhistory', showAddHistoryForm);

// POST — отправка формы
router.post('/addhistory', submitHistory);

export default router;
