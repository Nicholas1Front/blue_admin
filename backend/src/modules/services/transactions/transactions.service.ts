import { AppError } from "../../../shared/errors/AppError.js";
import transactionsRepository from "./transactions.repository.js";
import { updateTransactionsOriginDTO } from "./transactions.schema.js";

class TransactionsService{
    async updateOriginsForTransactions(
        serviceId : string,
        incomingTransaction : updateTransactionsOriginDTO
    ){
        const serviceExists = await transactionsRepository.findServiceById(serviceId);

        if(!serviceExists){
            throw new AppError('Service not found', 404, "SERVICE_NOT_FOUND")
        }

        const transactionExist = await transactionsRepository.findTransactionById(incomingTransaction.id);

        if(!transactionExist){
            throw new AppError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND')
        }

        const transaction = await transactionsRepository.updateTransactionOrigin(
            incomingTransaction.id,
            serviceExists.id,
            'service'
        )

        if(!transaction){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        return {
            service : serviceExists,
            transaction : transaction
        }
    }

    async removeOriginsForTransactions(
        transactionId : string
    ){
        const transactionExists = await transactionsRepository.findTransactionById(transactionId);

        if(!transactionExists){
            throw new AppError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND')
        }

        if(transactionExists.originId === null && transactionExists.originType === null){
            throw new AppError('Transactions not have originType and originId already', 400, 'TRANSACTION_NOT_HAVE_ORIGINS_ALREADY')
        }

        const transaction = await transactionsRepository.updateTransactionOrigin(
            transactionId,
            null,
            null
        )

        if(!transaction){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        return transaction
    }

    async findAllTransactionByServiceId(
        serviceId : string
    ){
        const serviceExists = await transactionsRepository.findServiceById(serviceId);

        if(!serviceExists){
            throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND')
        }

        const transactions = await transactionsRepository.findAllTransactionsByServiceId(serviceId)

        if(!transactions){
            throw new AppError('Internal server error', 500, "INTERNAL_SERVER_ERROR")
        }

        return {
            service : serviceExists,
            transactions : transactions
        }
    }
}

export default new TransactionsService()