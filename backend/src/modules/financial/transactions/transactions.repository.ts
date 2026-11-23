import { Prisma } from '../../../generated/prisma/client.js';
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

    async updateTransaction(id: string, data: any) {
        return prisma.$transaction(async tx => {
            await tx.$queryRaw`SELECT id FROM financial_transactions WHERE id = ${id} FOR UPDATE`
            const existing = await tx.financialTransaction.findUnique({ where: { id } })
            if (!existing) return null

            const linkedMovements = await tx.employeeMovement.count({ where: { financialTransactionId: id } })
            const nextType = data.type ?? existing.type
            if (linkedMovements > 0 && nextType !== 'expense') {
                return { invalidEmployeeTransactionType: true as const }
            }

            const linkedValue = await tx.employeeMovement.aggregate({
                where: { financialTransactionId: id }, _sum: { value: true }
            })
            const movementsTotal = linkedValue._sum.value ?? new Prisma.Decimal(0)
            const nextValue = data.value !== undefined ? new Prisma.Decimal(data.value) : existing.value
            if (nextValue.lt(movementsTotal)) return { valueBelowEmployeeMovements: true as const }

            const updated = await tx.financialTransaction.update({
                where: { id },
                data: {
                    ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
                    ...(data.description !== undefined ? { description: data.description } : {}),
                    ...(data.value !== undefined ? { value: data.value } : {}),
                    ...(data.type !== undefined ? { type: data.type } : {}),
                    ...(data.referenceDate !== undefined ? { referenceDate: data.referenceDate } : {})
                }
            })

            if (existing.originId !== null && (existing.originType === 'services' || existing.originType === 'service_tithe')) {
                const changes: string[] = []
                if (data.description !== undefined && data.description !== existing.description) changes.push(`descrição: "${existing.description}" → "${updated.description}"`)
                if (data.value !== undefined && Number(data.value) !== Number(existing.value)) changes.push(`valor: R$ ${Number(existing.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} → R$ ${Number(updated.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
                if (data.type !== undefined && data.type !== existing.type) changes.push(`tipo: ${existing.type === 'income' ? 'entrada' : 'despesa'} → ${updated.type === 'income' ? 'entrada' : 'despesa'}`)
                if (data.categoryId !== undefined && data.categoryId !== existing.categoryId) changes.push('categoria alterada')
                if (data.referenceDate !== undefined && data.referenceDate.getTime() !== existing.referenceDate.getTime()) {
                    const previousDate = existing.referenceDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                    const nextDate = updated.referenceDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                    changes.push(`data de referência: ${previousDate} → ${nextDate}`)
                }
                if (changes.length > 0) {
                    const isTithe = existing.originType === 'service_tithe'
                    await tx.serviceHistory.create({
                        data: {
                            serviceId: existing.originId,
                            eventType: isTithe ? 'dizimo_atualizado' : 'lancamento_atualizado',
                            description: `${isTithe ? 'Lançamento do dízimo' : 'Lançamento financeiro'} atualizado (ID: ${id}). ${changes.join('; ')}.`
                        }
                    })
                }
            }
            return updated
        })
    }

    async findTransactionById(id : string){
        return prisma.financialTransaction.findUnique({
            where : { id },
            include : {
                titheForService : {
                    select : { id : true }
                },
                employeeMovements : {
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
                ...(referenceDate !== undefined && (() => {
                    const startOfDay = new Date(Date.UTC(
                        referenceDate.getUTCFullYear(),
                        referenceDate.getUTCMonth(),
                        referenceDate.getUTCDate()
                    ));
                    const startOfNextDay = new Date(startOfDay);
                    startOfNextDay.setUTCDate(startOfNextDay.getUTCDate() + 1);

                    return {
                        referenceDate : {
                            gte : startOfDay,
                            lt : startOfNextDay
                        }
                    };
                })()),
                ...(originId !== undefined && { originId }),
                ...(originType !== undefined && { originType })
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

    async deleteTransaction(id: string) {
        return prisma.$transaction(async tx => {
            await tx.$queryRaw`SELECT id FROM financial_transactions WHERE id = ${id} FOR UPDATE`
            const linkedMovements = await tx.employeeMovement.count({ where: { financialTransactionId: id } })
            if (linkedMovements > 0) return { linkedToEmployeeMovements: true as const }
            return tx.financialTransaction.delete({ where: { id } })
        })
    }
}

export default new TransactionsRepository()
