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
        if (transactionExists.originId !== null || transactionExists.originType !== null) {
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
}

export default new TransactionsService()
