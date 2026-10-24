import { AppError } from "../../../shared/errors/AppError.js";
import transactionsRepository from "./transactions.repository.js";
import { updateTransactionsOriginDTO } from "./transactions.schema.js";

class TransactionsService {
    async updateOriginsForTransactions(
        serviceId: string,
        incomingTransaction: updateTransactionsOriginDTO
    ) {
        const serviceExists = await transactionsRepository.findServiceById(serviceId);
        if (!serviceExists) {
            throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND');
        }

        const transactionExists = await transactionsRepository.findTransactionById(incomingTransaction.id);
        if (!transactionExists) {
            throw new AppError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
        }

        // A transaction may only have one origin. Reject both complete and
        // partially populated origin pairs rather than silently reassigning it.
        if (
            transactionExists.originId !== null ||
            transactionExists.originType !== null ||
            transactionExists.titheForService !== null
        ) {
            throw new AppError(
                'Transaction is already linked to an origin and cannot be added again',
                409,
                'TRANSACTION_ALREADY_HAS_ORIGIN'
            );
        }

        const transaction = await transactionsRepository.linkTransactionToService(
            incomingTransaction.id,
            serviceExists.id
        );

        if (!transaction) {
            throw new AppError(
                'Transaction was linked or changed by another request',
                409,
                'TRANSACTION_ORIGIN_CONFLICT'
            );
        }

        return {
            service: serviceExists,
            transaction
        };
    }

    async removeOriginsForTransactions(transactionId: string) {
        const transactionExists = await transactionsRepository.findTransactionById(transactionId);
        if (!transactionExists) {
            throw new AppError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
        }

        if (transactionExists.titheForService !== null) {
            throw new AppError(
                'Use the tithe unlink operation to remove a tithe transaction',
                409,
                'TRANSACTION_IS_SERVICE_TITHE'
            );
        }

        if (
            transactionExists.originId === null ||
            transactionExists.originType !== 'services'
        ) {
            throw new AppError(
                'Transaction is not linked to a service',
                400,
                'TRANSACTION_NOT_LINKED_TO_SERVICE'
            );
        }

        const removed = await transactionsRepository.removeServiceOrigin(
            transactionId,
            transactionExists.originId
        );

        if (!removed) {
            throw new AppError(
                'Transaction origin changed before it could be removed',
                409,
                'TRANSACTION_ORIGIN_CONFLICT'
            );
        }

        return {
            ...transactionExists,
            originId: null,
            originType: null
        };
    }

    async findAllTransactionByServiceId(serviceId: string) {
        const serviceExists = await transactionsRepository.findServiceById(serviceId);
        if (!serviceExists) {
            throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND');
        }

        const transactions = await transactionsRepository.findAllTransactionsByServiceId(serviceId);

        return {
            service: serviceExists,
            transactions
        };
    }

    async updateTithe(
        transactionId : string,
        serviceId : string
    ){
        const transactionExists = await transactionsRepository.findTransactionById(transactionId)

        if(!transactionExists){
            throw new AppError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND')
        }

        if (
            transactionExists.originId !== null ||
            transactionExists.originType !== null ||
            transactionExists.titheForService !== null
        ) {
            throw new AppError(
                'Transaction is already linked to an origin and cannot be added again',
                409,
                'TRANSACTION_ALREADY_HAS_ORIGIN'
            )
        }

        const serviceExists = await transactionsRepository.findServiceById(serviceId)

        if(!serviceExists){
            throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND')
        }

        if(serviceExists.titheTransactionId !== null){
            throw new AppError(
                'This service already has a tithe transaction linked',
                409,
                'SERVICE_ALREADY_HAS_TITHE'
            )
        }

        let result
        try {
            result = await transactionsRepository.updateTithe(transactionId, serviceId)
        } catch(error) {
            if(error instanceof Error && error.message === 'TITHE_LINK_CONFLICT'){
                throw new AppError(
                    'The service or transaction changed while linking the tithe',
                    409,
                    'TITHE_LINK_CONFLICT'
                )
            }
            throw error
        }

        if(!result){
            throw new AppError(
                'The transaction is already linked or changed by another request',
                409,
                'TITHE_LINK_CONFLICT'
            )
        }

        return result
    }

    async removeTithe(
        transactionId : string,
        serviceId : string
    ){
        const transactionExists = await transactionsRepository.findTransactionById(transactionId)

        if(!transactionExists){
            throw new AppError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND')
        }

        const serviceExists = await transactionsRepository.findServiceById(serviceId)

        if(!serviceExists){
            throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND')
        }

        if(
            serviceExists.titheTransactionId !== transactionId ||
            transactionExists.originId !== serviceId ||
            transactionExists.originType !== 'services'
        ){
            throw new AppError(
                'This transaction is not the tithe linked to this service',
                409,
                'TITHE_LINK_MISMATCH'
            )
        }

        let result
        try {
            result = await transactionsRepository.removeTithe(transactionId, serviceId)
        } catch(error) {
            if(error instanceof Error && error.message === 'TITHE_LINK_CONFLICT'){
                throw new AppError(
                    'The service or transaction changed while removing the tithe',
                    409,
                    'TITHE_LINK_CONFLICT'
                )
            }
            throw error
        }

        if(!result){
            throw new AppError(
                'The tithe link changed before it could be removed',
                409,
                'TITHE_LINK_CONFLICT'
            )
        }

        return result
    }
}

export default new TransactionsService()
