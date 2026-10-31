import { Prisma } from '../../../generated/prisma/client.js'
import { prisma } from '../../../shared/database/prisma.js'
import { AppError } from '../../../shared/errors/AppError.js'

class BudgetItemRepository {
    create(budgetId: string, data: {
        title: string
        description?: string | null
        categoryId: string
        quantity: number
        unitValue: number
        discount: number
    }) {
        return prisma.$transaction(async tx => {
            const budget = await tx.budget.findUnique({ where: { id: budgetId } })
            if (!budget) return null

            const category = await tx.budgetCategory.findUnique({ where: { id: data.categoryId } })
            if (!category) {
                throw new AppError('Budget category not found', 404, 'BUDGET_CATEGORY_NOT_FOUND')
            }
            if (!category.isActive) {
                throw new AppError('Inactive categories cannot be used in new budget items', 400, 'BUDGET_CATEGORY_INACTIVE')
            }

            const grossAmount = new Prisma.Decimal(data.quantity).mul(new Prisma.Decimal(data.unitValue))
            const discount = new Prisma.Decimal(data.discount)
            if (discount.gt(grossAmount)) {
                throw new AppError('Item discount cannot be greater than its gross amount', 400, 'ITEM_DISCOUNT_EXCEEDS_TOTAL')
            }

            const item = await tx.budgetItem.create({
                data: {
                    budgetId,
                    title: data.title,
                    description: data.description ?? null,
                    categoryId: data.categoryId,
                    quantity: new Prisma.Decimal(data.quantity),
                    unitValue: new Prisma.Decimal(data.unitValue),
                    discount,
                    totalAmount: grossAmount.minus(discount)
                },
                include: { category: true }
            })

            const totals = await this.recalculateBudget(tx, budgetId, budget.globalDiscount)

            await tx.budgetHistory.create({
                data: {
                    budgetId,
                    eventType: 'item_orcamento_criado',
                    description: `Item adicionado ao orçamento: "${item.title}". Total do item: ${item.totalAmount.toString()}.`
                }
            })

            return { item, totals }
        })
    }

    findById(id: string) {
        return prisma.budgetItem.findUnique({
            where: { id },
            include: { category: true }
        })
    }

    findByBudgetId(budgetId: string) {
        return prisma.budgetItem.findMany({
            where: { budgetId },
            include: { category: true },
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
        })
    }

    update(id: string, data: Record<string, any>, description: string) {
        return prisma.$transaction(async tx => {
            const current = await tx.budgetItem.findUnique({ where: { id } })
            if (!current) return null

            if (data.categoryId !== undefined && data.categoryId !== current.categoryId) {
                const category = await tx.budgetCategory.findUnique({ where: { id: data.categoryId } })
                if (!category) {
                    throw new AppError('Budget category not found', 404, 'BUDGET_CATEGORY_NOT_FOUND')
                }
                if (!category.isActive) {
                    throw new AppError('Inactive categories cannot be used in new budget items', 400, 'BUDGET_CATEGORY_INACTIVE')
                }
            }

            const quantity = data.quantity !== undefined ? new Prisma.Decimal(data.quantity) : current.quantity
            const unitValue = data.unitValue !== undefined ? new Prisma.Decimal(data.unitValue) : current.unitValue
            const discount = data.discount !== undefined ? new Prisma.Decimal(data.discount) : current.discount
            const grossAmount = quantity.mul(unitValue)

            if (discount.gt(grossAmount)) {
                throw new AppError('Item discount cannot be greater than its gross amount', 400, 'ITEM_DISCOUNT_EXCEEDS_TOTAL')
            }

            const itemData = { ...data }
            delete itemData.eventType

            const item = await tx.budgetItem.update({
                where: { id },
                data: {
                    ...itemData,
                    quantity,
                    unitValue,
                    discount,
                    totalAmount: grossAmount.minus(discount)
                },
                include: { category: true }
            })

            const budget = await tx.budget.findUnique({ where: { id: current.budgetId } })
            if (!budget) throw new AppError('Budget not found', 404, 'BUDGET_NOT_FOUND')

            const totals = await this.recalculateBudget(tx, current.budgetId, budget.globalDiscount)

            await tx.budgetHistory.create({
                data: {
                    budgetId: current.budgetId,
                    eventType: 'item_orcamento_atualizado',
                    description
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

    private async recalculateBudget(
        tx: Prisma.TransactionClient,
        budgetId: string,
        globalDiscount: Prisma.Decimal
    ) {
        const aggregate = await tx.budgetItem.aggregate({
            where: { budgetId },
            _sum: { totalAmount: true }
        })

        const totalAmount = aggregate._sum.totalAmount ?? new Prisma.Decimal(0)

        if (globalDiscount.gt(totalAmount)) {
            throw new AppError(
                'Global discount cannot be greater than the budget items total. Update the global discount before changing items.',
                400,
                'GLOBAL_DISCOUNT_EXCEEDS_TOTAL'
            )
        }

        const finalAmount = totalAmount.minus(globalDiscount)

        await tx.budget.update({
            where: { id: budgetId },
            data: { totalAmount, finalAmount }
        })

        return { totalAmount, globalDiscount, finalAmount }
    }
}

export default new BudgetItemRepository()
