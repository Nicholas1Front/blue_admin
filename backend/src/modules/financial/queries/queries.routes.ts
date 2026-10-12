import {Router} from 'express';
import {authMiddleware} from '../../../middlewares/auth.middleware.js';
import queriesController from './queries.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/monthly-summary', queriesController.findMonthlySummary);
router.get('/yearly-summary', queriesController.findYearlySummary);

export default router;
