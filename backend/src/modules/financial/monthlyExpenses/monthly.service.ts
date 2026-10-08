import expensesRepository from './monthly.repository.js';
import {AppError} from '../../../shared/errors/AppError.js';
import type {
    createExpenseDTO,
    updateExpenseDTO,
    findExpensesByFiltersDTO
} from './monthly.dto.js';
import {removeUndefined} from '../../../shared/helpers/objects/removeUndefined.js';
import {undefinedToNull} from '../../../shared/helpers/objects/undefinedToNull.js';

class ExpensesService{

    /* TODO : make a function to calculate the total of employees which you 
    can put here or in the employees modules in the service or in a helper */

    async createExpense(
        data : createExpenseDTO
    ){
        const cleanedData = undefinedToNull(data)

        const expense = await expensesRepository.createExpense(
            cleanedData.name,
            cleanedData.description,
            cleanedData.expectedValue,
            cleanedData.dueDate,
            cleanedData.notes
        )

        if(!expense){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        return expense
    }

    async updateExpense(
        id : string,
        data : updateExpenseDTO
    ){
        const cleanedData = removeUndefined(data)

        const expenseExists = await expensesRepository.findExpenseById(id)

        if(!expenseExists){
            throw new AppError('Expense not found', 404, 'EXPENSE_NOT_FOUND')
        }

        const expense = await expensesRepository.updateExpense(id, cleanedData)

        if(!expense){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        return expense

    }

    async findExpensesByFilters(
        filters : findExpensesByFiltersDTO
    ){
        const cleanedFilters = removeUndefined(filters)
        const expenses = await expensesRepository.findExpensesByFilters(
            cleanedFilters.id,
            cleanedFilters.name,
            cleanedFilters.description,
            cleanedFilters.expectedValue,
            cleanedFilters.dueDate,
            cleanedFilters.notes,
            cleanedFilters.active
        )

        if(!expenses){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        return expenses
    }

    async findAllExpenses(){
        const expenses = await expensesRepository.findAllExpenses();

        if(!expenses){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        return expenses
    }

    async deactivateExpense(id : string){
        const expenseExists = await expensesRepository.findExpenseById(id)

        if(!expenseExists){
            throw new AppError('Expense not found', 404, 'EXPENSE_NOT_FOUND')
        }

        if(expenseExists.active === false){
            throw new AppError('Expense already deactivated', 400, 'EXPENSE_ALREADY_DEACTIVATED')
        }

        const expense = await expensesRepository.deactivateExpense(id)

        if(!expense){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        return expense
    }

    async activateExpense(id : string){
        const expenseExists = await expensesRepository.findExpenseById(id)

        if(!expenseExists){
            throw new AppError('Expense not found', 404, 'EXPENSE_NOT_FOUND')
        }

        if(expenseExists.active === true){
            throw new AppError('Expense already activated', 400, 'EXPENSE_ALREADY_ACTIVATED')
        }

        const expense = await expensesRepository.activateExpense(id)

        if(!expense){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        return expense
    }

    async deleteExpense(id : string){
        const expenseExists = await expensesRepository.findExpenseById(id)

        if(!expenseExists){
            throw new AppError('Expense not found', 404, 'EXPENSE_NOT_FOUND')
        }

        const result = await expensesRepository.deleteExpense(id)

        if(!result){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        return true
    }
}

export default new ExpensesService();