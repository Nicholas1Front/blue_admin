import transactionsRepository from './transactions.repository.js';
import categoryRepository from '../financialCategories/category.repository.js';
import {AppError} from '../../../shared/errors/AppError.js';
import type {
    createTransactionDTO,
    updateTransactionDTO,
    findTransactionsByFiltersDTO,
    findTransactionsPaginatedDTO
} from './transactions.dto.js';
import {removeUndefined} from '../../../shared/helpers/objects/removeUndefined.js';
import {undefinedToNull} from '../../../shared/helpers/objects/undefinedToNull.js';
import {allowedTypes} from '../shared/allowedTypesList.js';

class TransactionsService{
    async createTransaction(
        data : createTransactionDTO
    ){
        const categoryExists = await categoryRepository.findCategoryById(data.categoryId)

        if(!categoryExists){
            throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND')
        }

        if(categoryExists.active === false){
            throw new AppError('Cannot create a transaction with an inactive category', 400, 'CATEGORY_INACTIVE')
        }

        let cleanedData = undefinedToNull(data)

        cleanedData.type = categoryExists.type

        const transaction = await transactionsRepository.createTransaction(
            cleanedData.categoryId,
            cleanedData.description,
            cleanedData.value,
            cleanedData.type,
            cleanedData.referenceDate
        )

        if(!transaction){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        return transaction
    }

    async updateTransaction(
        id : string,
        data : updateTransactionDTO
    ){
        const cleanedData = removeUndefined(data)

        const transactionExists = await transactionsRepository.findTransactionById(id)

        if(!transactionExists){
            throw new AppError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND')
        }

        if(cleanedData.categoryId !== undefined){
            const categoryExists = await categoryRepository.findCategoryById(cleanedData.categoryId)

            if(!categoryExists){
                throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND')
            }

            if(categoryExists.active === false){
                throw new AppError('Cannot assign an inactive category to a transaction', 400, 'CATEGORY_INACTIVE')
            }

            cleanedData.type = categoryExists.type
        }

        const transaction = await transactionsRepository.updateTransaction(id, cleanedData)

        if(!transaction){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        return transaction
    }

    async findTransactionsByFilters(filters : findTransactionsByFiltersDTO){
        const cleanedFilters = removeUndefined(filters)
        const transactions = await transactionsRepository.findTransactionsByFilters(
            cleanedFilters.id,
            cleanedFilters.categoryId,
            cleanedFilters.description,
            cleanedFilters.value,
            cleanedFilters.type,
            cleanedFilters.referenceDate,
            cleanedFilters.originId,
            cleanedFilters.originType
        )

        if(!transactions){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        return transactions
    }

    async findTransactionsPaginated(filters : findTransactionsPaginatedDTO){
        const result = await transactionsRepository.findTransactionsPaginated(
            filters.year,
            filters.month,
            filters.page,
            filters.limit,
            filters.categoryId,
            filters.type,
            filters.description
        );

        return {
            transactions : result.transactions,
            page : filters.page,
            limit : filters.limit,
            total : result.total,
            totalPages : Math.ceil(result.total / filters.limit)
        };
    }

    async deleteTransaction(id : string){
        const transactionExists = await transactionsRepository.findTransactionById(id)

        if(!transactionExists){
            throw new AppError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND')
        }

        if (
            transactionExists.originId !== null ||
            transactionExists.originType !== null ||
            transactionExists.titheForService !== null
        ) {
            throw new AppError(
                'Cannot delete a transaction while it is linked to a service or another origin',
                409,
                'TRANSACTION_LINKED_TO_ORIGIN'
            )
        }

        const result = await transactionsRepository.deleteTransaction(id)

        if(!result){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        return true
    }
}

export default new TransactionsService();
