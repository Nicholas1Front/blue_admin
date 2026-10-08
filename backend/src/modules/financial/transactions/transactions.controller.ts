import{Request,Response} from 'express'
import transactionsService from './transactions.service.js'
import {AppError} from '../../../shared/errors/AppError.js'
import {
    createTransactionSchema,
    updateTransactionSchema,
    findTransactionsByFiltersSchema
} from './transactions.schema.js'

class TransactionsController{
    async createTransaction(req : Request, res : Response){
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        const data = createTransactionSchema.parse(req.body);

        const transaction = await transactionsService.createTransaction(data);

        return res.status(200).json({
            message : 'Transaction created successfully',
            data : transaction
        })
    }

    async updateTransaction(req : Request, res : Response){
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        const data = updateTransactionSchema.parse(req.body);

        const transaction = await transactionsService.updateTransaction(
            req.params.id as string,
            data
        );

        return res.status(200).json({
            message : 'Transaction updated successfully',
            data : transaction
        })
    }

    async findTransactionsByFilters(req : Request, res : Response){
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        const filters = findTransactionsByFiltersSchema.parse(req.query);

        const transactions = await transactionsService.findTransactionsByFilters(filters);

        return res.status(200).json({
            message : 'Transactions found successfully using filters',
            data : transactions
        })
    }

    async deleteTransaction(req : Request, res : Response){
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        await transactionsService.deleteTransaction(req.params.id as string);

        return res.status(200).json({
            message : 'Transaction deleted successfully'
        })
    }
}

export default new TransactionsController()
