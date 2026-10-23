import {Request, Response} from 'express';
import {
    updateTransactionsOriginSchema
} from './transactions.schema.js'
import { AppError } from '../../../shared/errors/AppError.js';
import transactionsService from './transactions.service.js';

class TransactionsController{
    async updateOrigins(
        req : Request,
        res : Response
    ){
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        const data = updateTransactionsOriginSchema.parse(req.body)

        const response = await transactionsService.updateOriginsForTransactions(
            req.params.serviceId as string,
            data
        )

        return res.status(200).json({
            message : 'Origin updated successfully in transaction',
            data : response
        })
    }

    async removeOrigins(
        req : Request,
        res : Response
    ){
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        const response = await transactionsService.removeOriginsForTransactions(
            req.params.transactionId as string
        )

        return res.status(200).json({
            message : 'Origin removed successfully in transaction',
            data : response
        })
    }

    async findAllTransactionsByService(
        req : Request,
        res : Response
    ){
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        const response = await transactionsService.findAllTransactionByServiceId(
            req.params.serviceId as string
        )

        return res.status(200).json({
            message : 'All transactions of service founded successfully',
            data : response
        })
    }
}

export default new TransactionsController()