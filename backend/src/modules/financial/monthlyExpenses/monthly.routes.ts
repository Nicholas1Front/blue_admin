import {Router} from 'express';
import expensesController from './monthly.controller.js';
import {authMiddleware} from '../../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/create-expense', expensesController.createExpense);

router.put('/update-expense/:id', expensesController.updateExpense);

router.get('/find-all-expenses', expensesController.findAllExpenses);
router.get('/find-expenses-by-filters', expensesController.findExpensesByFilters);

router.patch('/deactivate-expense/:id', expensesController.deactivateExpense);
router.patch('/activate-expense/:id', expensesController.activateExpense);

router.delete('/delete-expense/:id', expensesController.deleteExpense);

export default router