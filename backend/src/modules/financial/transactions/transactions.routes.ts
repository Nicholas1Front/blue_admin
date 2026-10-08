import{Router} from 'express';
import transactionsController from './transactions.controller.js';
import {authMiddleware} from '../../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/create-transaction', transactionsController.createTransaction);

router.put('/update-transaction/:id', transactionsController.updateTransaction);

router.get('/find-transactions-by-filters', transactionsController.findTransactionsByFilters);

router.delete('/delete-transaction/:id', transactionsController.deleteTransaction);

export default router