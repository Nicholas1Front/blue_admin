import {prisma} from '../../../shared/database/prisma.js';

class TransactionsRepository{
    async createTransaction(
        categoryId: string,
        description: string,
        value: number,
        type: string,
        referenceDate: Date,
        originId: string | null,
        originType: string | null
    ){
        return prisma.financialTransaction.create({
            data : {
                categoryId,
                description,
                value,
                type,
                referenceDate,
                originId,
                originType
            }
        })
    }

    async updateTransaction(
        id : string,
        data : any
    ){
        return prisma.financialTransaction.update({
            where : { id },
            data : {
                categoryId : data.categoryId,
                description : data.description,
                value : data.value,
                type : data.type,
                referenceDate : data.referenceDate,
                originId : data.originId,
                originType : data.originType
            }
        })
    }

    async findTransactionById(id : string){
        return prisma.financialTransaction.findUnique({
            where : { id }
        })
    }

    async findTransactionsByFilters(
        id : string | undefined,
        categoryId : string | undefined,
        description : string | undefined,
        value : number | undefined,
        type : string | undefined,
        referenceDate : Date | undefined,
        originId : string | null | undefined,
        originType : string | null | undefined
    ){
        return prisma.financialTransaction.findMany({
            where : {
                ...(id !== undefined && { id : id, mode : 'insensitive' }),
                ...(categoryId !== undefined && { categoryId : categoryId, mode : 'insensitive' }),
                ...(description !== undefined && { description : description, mode : 'insensitive' }),
                ...(value !== undefined && { value : value, mode : 'insensitive' }),
                ...(type !== undefined && { type : type, mode : 'insensitive' }),
                ...(referenceDate !== undefined && { referenceDate : referenceDate, mode : 'insensitive' }),
                ...(originId !== undefined && (
                    originId === null
                        ? { originId : null }
                        : {
                            originId : {
                                contains : originId,
                                mode : 'insensitive'
                            }
                        }
                )),
                ...(originType !== undefined && (
                    originType === null
                        ? { originType : null }
                        : {
                            originType : {
                                contains : originType,
                                mode : 'insensitive'
                            }
                        }
                ))
            }
        })
    }

    async deleteTransaction(id : string){
        return prisma.financialTransaction.delete({
            where : { id }
        })
    }
}

export default new TransactionsRepository()