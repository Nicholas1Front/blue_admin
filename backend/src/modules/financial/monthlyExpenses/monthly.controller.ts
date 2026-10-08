import{Request,Response} from 'express';
import {AppError} from '../../../shared/errors/AppError.js';
import expensesService from './monthly.service.js';
import {
    createExpenseSchema,
    updateExpenseSchema,
    findExpensesByFiltersSchema
} from './monthly.schema.js';

class ExpensesController{
    async createExpense(req : Request, res : Response){
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        const data = createExpenseSchema.parse(req.body);

        const expense = await expensesService.createExpense(data);

        return res.status(200).json({
            message : 'Expense created successfully',
            data : expense
        })
    }

    async updateExpense(req: Request, res : Response){
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        const data = updateExpenseSchema.parse(req.body);

        const expense = await expensesService.updateExpense(
            req.params.id as string,
            data
        );

        return res.status(200).json({
            message : 'Expense updated successfully',
            data : expense
        })
    }

    async findExpensesByFilters(req : Request, res : Response){
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        const data = findExpensesByFiltersSchema.parse(req.query);

        const expenses = await expensesService.findExpensesByFilters(data);

        return res.status(200).json({
            message : 'Expenses found successfully',
            data : expenses
        })
    }

    async findAllExpenses(req : Request, res : Response){
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        const expenses = await expensesService.findAllExpenses();

        return res.status(200).json({
            message : 'Expenses found successfully',
            data : expenses
        })
    }

    async deactivateExpense(req : Request, res : Response){
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        const expense = await expensesService.deactivateExpense(req.params.id as string);

        return res.status(200).json({
            message : 'Expense deactivated successfully',
            data : expense
        })
    }

    async activateExpense(req : Request, res : Response){
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        const expense = await expensesService.activateExpense(req.params.id as string);

        return res.status(200).json({
            message : 'Expense activated successfully',
            data : expense
        })
    }

    async deleteExpense(req : Request, res : Response){
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        await expensesService.deleteExpense(req.params.id as string);

        return res.status(200).json({
            message : 'Expense deleted successfully'
        })
    }
}

export default new ExpensesController();