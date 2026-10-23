import {prisma} from '../../../shared/database/prisma.js';

class TransactionsRepository{
    async createTransaction(
        categoryId: string,
        description: string,
        value: number,
        type: string,
        referenceDate: Date
    ){
        return prisma.financialTransaction.create({
            data : {
                categoryId,
                description,
                value,
                type,
                referenceDate,
                originId : null,
                originType : null
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
                referenceDate : data.referenceDate
            }
        })
    }

    async findTransactionById(id : string){
        return prisma.financialTransaction.findUnique({
            where : { id },
            include : {
                titheForService : {
                    select : { id : true }
                }
            }
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
        const transactions = await prisma.financialTransaction.findMany({
            where : {
                ...(id !== undefined && {
                    id : {
                        contains : id,
                        mode : 'insensitive'
                    }
                }),
                ...(categoryId !== undefined && {
                    categoryId : {
                        contains : categoryId,
                        mode : 'insensitive'
                    }
                }),
                ...(description !== undefined && {
                    description : {
                        contains : description,
                        mode : 'insensitive'
                    }
                }),
                ...(value !== undefined && {
                    value : {
                        equals : value
                    }
                }),
                ...(type !== undefined && {
                    type : {
                        contains : type,
                        mode : 'insensitive'
                    }
                }),
                ...(referenceDate !== undefined && {
                    referenceDate : {
                        equals : referenceDate
                    }
                }),
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
            },
            include : {
                category : {
                    select : {
                        name : true
                    }
                }
            },
            orderBy : [
                { referenceDate : 'desc' },
                { createdAt : 'desc' },
                { id : 'asc' }
            ]
        });

        return transactions.map(({ category, value, ...transaction }) => ({
            ...transaction,
            value : Number(value),
            categoryName : category.name
        }));
    }

    async findTransactionsPaginated(
        year : number,
        month : number,
        page : number,
        limit : number,
        categoryId : string | undefined,
        type : string | undefined,
        description : string | undefined
    ){
        const startDate = new Date(0);
        startDate.setUTCFullYear(year, month - 1, 1);
        startDate.setUTCHours(0, 0, 0, 0);

        const endDate = new Date(0);
        endDate.setUTCFullYear(year, month, 1);
        endDate.setUTCHours(0, 0, 0, 0);

        const where = {
            referenceDate : {
                gte : startDate,
                lt : endDate
            },
            ...(categoryId !== undefined && { categoryId }),
            ...(type !== undefined && { type }),
            ...(description !== undefined && {
                description : {
                    contains : description,
                    mode : 'insensitive' as const
                }
            })
        };

        const [transactions, total] = await Promise.all([
            prisma.financialTransaction.findMany({
                where,
                skip : (page - 1) * limit,
                take : limit,
                orderBy : [
                    { referenceDate : 'asc' },
                    { createdAt : 'asc' },
                    { id : 'asc' }
                ],
                include : {
                    category : {
                        select : {
                            name : true
                        }
                    }
                }
            }),
            prisma.financialTransaction.count({ where })
        ]);

        return {
            transactions : transactions.map(({ category, value, ...transaction }) => ({
                ...transaction,
                value : Number(value),
                categoryName : category.name
            })),
            total
        };
    }

    async deleteTransaction(id : string){
        return prisma.financialTransaction.delete({
            where : { id }
        })
    }
}

export default new TransactionsRepository()
