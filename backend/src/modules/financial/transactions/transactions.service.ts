import transactionsRepository from './transactions.repository.js';
import categoryRepository from '../financialCategories/category.repository.js';
import {AppError} from '../../../shared/errors/AppError.js';
import type {
    createTransactionDTO,
    updateTransactionDTO,
    findTransactionsByFiltersDTO
} from './transactions.dto.js';
import {removeUndefined} from '../../../shared/helpers/objects/removeUndefined.js';
import {undefinedToNull} from '../../../shared/helpers/objects/undefinedToNull.js';
// import {allowedOrigensList, verifyOrigin} from '../shared/allowedOrigensList.js';

class TransactionsService{
    async createTransaction(
        data : createTransactionDTO
    ){
        const categoryExists = await categoryRepository.findCategoryById(data.categoryId)

        if(!categoryExists){
            throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND')
        }

        const cleanedData = undefinedToNull(data)

        if(cleanedData.type !== categoryExists.type){
            throw new AppError('Category type does not match transaction type', 400, 'CATEGORY_TYPE_MISMATCH')
        }

        // todo : needs to create a function to check if the originId and originType are valid in allowedOrigensList
        /* if(cleanedData.originId !== null && cleanedData.originType !== null){
            if(!allowedOrigensList.includes(cleanedData.originType)){
                throw new AppError('Invalid origin type', 400, 'INVALID_ORIGIN_TYPE')
            }
        } */

        const transaction = await transactionsRepository.createTransaction(
            cleanedData.categoryId,
            cleanedData.description,
            cleanedData.value,
            cleanedData.type,
            cleanedData.referenceDate,
            cleanedData.originId,
            cleanedData.originType
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

        const categoryExists = await categoryRepository.findCategoryById(cleanedData.categoryId)

        if(cleanedData.categoryId !== undefined){
            if(!categoryExists){
                throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND')
            }
        }

        if(cleanedData.type !== undefined && categoryExists){
            if(categoryExists.type !== cleanedData.type){
                throw new AppError('Category type does not match transaction type', 400, 'CATEGORY_TYPE_MISMATCH')
            }
        }

        /* if(cleanedData.originId !== undefined && cleanedData.originType !== undefined){
            if(!allowedOrigensList.includes(cleanedData.originType)){
                throw new AppError('Invalid origin type', 400, 'INVALID_ORIGIN_TYPE')
            }
        } */

        const transaction = await transactionsRepository.updateTransaction(id, cleanedData)

        if(!transaction){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        return transaction
    }

    async findTransactionsByFilters(filters : findTransactionsByFiltersDTO){
        const transactions = await transactionsRepository.findTransactionsByFilters(
            filters.id,
            filters.categoryId,
            filters.description,
            filters.value,
            filters.type,
            filters.referenceDate,
            filters.originId,
            filters.originType
        )

        if(!transactions){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        return transactions
    }

    async deleteTransaction(id : string){
        const transactionExists = await transactionsRepository.findTransactionById(id)

        if(!transactionExists){
            throw new AppError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND')
        }

        const result = await transactionsRepository.deleteTransaction(id)

        if(!result){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        return true
    }
}

export default new TransactionsService();