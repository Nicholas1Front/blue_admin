import { Prisma } from '../../../generated/prisma/client.js'
import { prisma } from '../../../shared/database/prisma.js'
import { AppError } from '../../../shared/errors/AppError.js'
import type { FindBudgetItemsByFiltersDTO } from './items.schema.js'

const toDateRange = (from?: string, to?: string) => {
    if (from === undefined && to === undefined) return undefined

    const range: { gte?: Date; lt?: Date } = {}
    if (from !== undefined) range.gte = new Date(`${from}T00:00:00.000Z`)
    if (to !== undefined) {
        const endExclusive = new Date(`${to}T00:00:00.000Z`)
        endExclusive.setUTCDate(endExclusive.getUTCDate() + 1)
        range.lt = endExclusive
    }
    return range
}

class BudgetItemRepository {
    budgetExists(budgetId: string) {
        return prisma.budget.findUnique({ where: { id: budgetId }, select: { id: true } })
    }

    create(budgetId: string, data: {
        title: string
        description?: string | null | undefined
        categoryId: string
        quantity: number
        unitValue: number
        discount: number
    }) {
        return prisma.$transaction(async tx => {
            const budget = await tx.budget.findUnique({ where: { id: budgetId } })
            if (!budget) return null

            const category = await tx.budgetCategory.findUnique({ where: { id: data.categoryId } })
            if (!category) throw new AppError('Budget category not found', 404, 'BUDGET_CATEGORY_NOT_FOUND')
            if (!category.isActive) {
                throw new AppError('Inactive categories cannot be used in new budget items', 400, 'BUDGET_CATEGORY_INACTIVE')
            }

            const grossAmount = new Prisma.Decimal(data.quantity).mul(new Prisma.Decimal(data.unitValue))
            const discount = new Prisma.Decimal(data.discount)
            const itemTotal = grossAmount.mul(new Prisma.Decimal(100).minus(discount)).div(100)

            const item = await tx.budgetItem.create({
                data: {
                    budgetId,
                    title: data.title,
                    description: data.description ?? null,
                    categoryId: data.categoryId,
                    quantity: new Prisma.Decimal(data.quantity),
                    unitValue: new Prisma.Decimal(data.unitValue),
                    discount,
                    totalAmount: itemTotal
                },
                include: { category: true }
            })

            const totals = await this.recalculateBudget(tx, budgetId, budget.globalDiscount)
            await tx.budgetHistory.create({
                data: {
                    budgetId,
                    eventType: 'item_orcamento_criado',
                    description: `Item adicionado ao orçamento: "${item.title}". Desconto: ${discount.toString()}%. Total do item: ${item.totalAmount.toString()}.`
                }
            })

            return { item, totals }
        })
    }

    findById(id: string) {
        return prisma.budgetItem.findUnique({ where: { id }, include: { category: true } })
    }

    findByBudgetId(budgetId: string) {
        return prisma.budgetItem.findMany({
            where: { budgetId },
            include: { category: true },
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
        })
    }

    async findByFilters(filters: FindBudgetItemsByFiltersDTO) {
        const createdAt = toDateRange(filters.createdAtFrom, filters.createdAtTo)
        const updatedAt = toDateRange(filters.updatedAtFrom, filters.updatedAtTo)

        const where: Prisma.BudgetItemWhereInput = {
            ...(filters.id !== undefined && { id: { contains: filters.id, mode: 'insensitive' } }),
            ...(filters.budgetId !== undefined && { budgetId: filters.budgetId }),
            ...(filters.title !== undefined && { title: { contains: filters.title, mode: 'insensitive' } }),
            ...(filters.description !== undefined && { description: { contains: filters.description, mode: 'insensitive' } }),
            ...(filters.categoryId !== undefined && { categoryId: filters.categoryId }),
            ...((filters.quantityMin !== undefined || filters.quantityMax !== undefined) && {
                quantity: {
                    ...(filters.quantityMin !== undefined && { gte: new Prisma.Decimal(filters.quantityMin) }),
                    ...(filters.quantityMax !== undefined && { lte: new Prisma.Decimal(filters.quantityMax) })
                }
            }),
            ...((filters.unitValueMin !== undefined || filters.unitValueMax !== undefined) && {
                unitValue: {
                    ...(filters.unitValueMin !== undefined && { gte: new Prisma.Decimal(filters.unitValueMin) }),
                    ...(filters.unitValueMax !== undefined && { lte: new Prisma.Decimal(filters.unitValueMax) })
                }
            }),
            ...((filters.totalAmountMin !== undefined || filters.totalAmountMax !== undefined) && {
                totalAmount: {
                    ...(filters.totalAmountMin !== undefined && { gte: new Prisma.Decimal(filters.totalAmountMin) }),
                    ...(filters.totalAmountMax !== undefined && { lte: new Prisma.Decimal(filters.totalAmountMax) })
                }
            }),
            ...((filters.discountMin !== undefined || filters.discountMax !== undefined) && {
                discount: {
                    ...(filters.discountMin !== undefined && { gte: new Prisma.Decimal(filters.discountMin) }),
                    ...(filters.discountMax !== undefined && { lte: new Prisma.Decimal(filters.discountMax) })
                }
            }),
            ...(createdAt !== undefined && { createdAt }),
            ...(updatedAt !== undefined && { updatedAt })
        }

        const [items, total] = await Promise.all([
            prisma.budgetItem.findMany({
                where,
                skip: (filters.page - 1) * filters.limit,
                take: filters.limit,
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
            }),
            prisma.budgetItem.count({ where })
        ])

        return {
            items,
            page: filters.page,
            limit: filters.limit,
            total,
            totalPages: Math.ceil(total / filters.limit)
        }
    }

    update(id: string, data: any, description: string) {
        return prisma.$transaction(async tx => {
            const current = await tx.budgetItem.findUnique({ where: { id } })
            if (!current) return null

            if (data.categoryId !== undefined && data.categoryId !== current.categoryId) {
                const category = await tx.budgetCategory.findUnique({ where: { id: data.categoryId } })
                if (!category) throw new AppError('Budget category not found', 404, 'BUDGET_CATEGORY_NOT_FOUND')
                if (!category.isActive) {
                    throw new AppError('Inactive categories cannot be used in new budget items', 400, 'BUDGET_CATEGORY_INACTIVE')
                }
            }

            const quantity = data.quantity !== undefined ? new Prisma.Decimal(data.quantity) : current.quantity
            const unitValue = data.unitValue !== undefined ? new Prisma.Decimal(data.unitValue) : current.unitValue
            const discount = data.discount !== undefined ? new Prisma.Decimal(data.discount) : current.discount
            const grossAmount = quantity.mul(unitValue)
            const itemTotal = grossAmount.mul(new Prisma.Decimal(100).minus(discount)).div(100)

            const item = await tx.budgetItem.update({
                where: { id },
                data: { ...data, quantity, unitValue, discount, totalAmount: itemTotal },
                include: { category: true }
            })

            const budget = await tx.budget.findUnique({ where: { id: current.budgetId } })
            if (!budget) throw new AppError('Budget not found', 404, 'BUDGET_NOT_FOUND')
            const totals = await this.recalculateBudget(tx, current.budgetId, budget.globalDiscount)

            await tx.budgetHistory.create({
                data: {
                    budgetId: current.budgetId,
                    eventType: 'item_orcamento_atualizado',
                    description: `${description} Desconto aplicado: ${discount.toString()}%.`
                }
            })

            return { item, totals }
        })
    }

    delete(id: string) {
        return prisma.$transaction(async tx => {
            const item = await tx.budgetItem.findUnique({ where: { id } })
            if (!item) return null

            const budget = await tx.budget.findUnique({ where: { id: item.budgetId } })
            if (!budget) throw new AppError('Budget not found', 404, 'BUDGET_NOT_FOUND')

            await tx.budgetItem.delete({ where: { id } })
            const totals = await this.recalculateBudget(tx, item.budgetId, budget.globalDiscount)

            await tx.budgetHistory.create({
                data: {
                    budgetId: item.budgetId,
                    eventType: 'item_orcamento_excluido',
                    description: `Item removido do orçamento: "${item.title}".`
                }
            })

            return { totals }
        })
    }

    private async recalculateBudget(tx: Prisma.TransactionClient, budgetId: string, globalDiscount: Prisma.Decimal) {
        const aggregate = await tx.budgetItem.aggregate({
            where: { budgetId },
            _sum: { totalAmount: true }
        })
        const totalAmount = aggregate._sum.totalAmount ?? new Prisma.Decimal(0)
        const finalAmount = totalAmount.mul(new Prisma.Decimal(100).minus(globalDiscount)).div(100)

        await tx.budget.update({
            where: { id: budgetId },
            data: { totalAmount, globalDiscount, finalAmount }
        })
        return { totalAmount, globalDiscount, finalAmount }
    }
}

export default new BudgetItemRepository()
