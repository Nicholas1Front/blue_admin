import { Prisma } from '../../../generated/prisma/client.js'
import { AppError } from '../../../shared/errors/AppError.js'
import { allowedBudgetStatus } from '../shared/allowedBudgetStatus.js'
import budgetQueriesRepository from './queries.repository.js'
import type {
    BudgetDashboardQueryDTO,
    BudgetMetricsQueryDTO,
    FindBudgetsByAdvancedFiltersDTO
} from './queries.schema.js'

type DecimalValue = { toNumber(): number }
const toNumber = (value: DecimalValue) => value.toNumber()

class BudgetQueriesService {
    async findBudgetById(id: string) {
        const budget = await budgetQueriesRepository.findBudgetDetailsById(id)

        if (!budget) {
            throw new AppError('Budget not found', 404, 'BUDGET_NOT_FOUND')
        }

        type NormalizedItem = {
            id: string
            title: string
            description: string | null
            quantity: number
            unitValue: number
            discount: number
            grossAmount: number
            discountAmount: number
            totalAmount: number
            createdAt: Date
            updatedAt: Date
        }

        type CategoryAccumulator = {
            id: string
            name: string
            description: string | null
            isActive: boolean
            itemCount: number
            quantityTotal: Prisma.Decimal
            grossAmount: Prisma.Decimal
            itemDiscountAmount: Prisma.Decimal
            totalAmount: Prisma.Decimal
            items: NormalizedItem[]
        }

        const categories = new Map<string, CategoryAccumulator>()

        const items = budget.items.map(item => {
            const grossAmount = item.quantity.mul(item.unitValue)
            const discountAmount = grossAmount.minus(item.totalAmount)

            const normalizedItem: NormalizedItem = {
                id: item.id,
                title: item.title,
                description: item.description,
                quantity: toNumber(item.quantity),
                unitValue: toNumber(item.unitValue),
                discount: toNumber(item.discount),
                grossAmount: toNumber(grossAmount),
                discountAmount: toNumber(discountAmount),
                totalAmount: toNumber(item.totalAmount),
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
            }

            const categoryId = item.category.id
            const currentCategory = categories.get(categoryId)

            if (currentCategory) {
                currentCategory.items.push(normalizedItem)
                currentCategory.itemCount += 1
                currentCategory.quantityTotal = currentCategory.quantityTotal.plus(item.quantity)
                currentCategory.grossAmount = currentCategory.grossAmount.plus(grossAmount)
                currentCategory.itemDiscountAmount = currentCategory.itemDiscountAmount.plus(discountAmount)
                currentCategory.totalAmount = currentCategory.totalAmount.plus(item.totalAmount)
            } else {
                categories.set(categoryId, {
                    id: item.category.id,
                    name: item.category.name,
                    description: item.category.description,
                    isActive: item.category.isActive,
                    itemCount: 1,
                    quantityTotal: item.quantity,
                    grossAmount,
                    itemDiscountAmount: discountAmount,
                    totalAmount: item.totalAmount,
                    items: [normalizedItem]
                })
            }

            return { grossAmount, discountAmount, totalAmount: item.totalAmount }
        })

        const groupedItems = [...categories.values()]
            .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
            .map(category => ({
                id: category.id,
                name: category.name,
                description: category.description,
                isActive: category.isActive,
                itemCount: category.itemCount,
                quantityTotal: toNumber(category.quantityTotal),
                grossAmount: toNumber(category.grossAmount),
                itemDiscountAmount: toNumber(category.itemDiscountAmount),
                totalAmount: toNumber(category.totalAmount),
                items: category.items
            }))

        const grossAmount = items.reduce(
            (total, item) => total.plus(item.grossAmount),
            new Prisma.Decimal(0)
        )
        const itemDiscountAmount = items.reduce(
            (total, item) => total.plus(item.discountAmount),
            new Prisma.Decimal(0)
        )
        const totalAmount = toNumber(budget.totalAmount)
        const globalDiscount = toNumber(budget.globalDiscount)
        const globalDiscountAmount = budget.totalAmount.mul(budget.globalDiscount).div(100)
        const finalAmount = toNumber(budget.finalAmount)

        return {
            budget: {
                id: budget.id,
                clientId: budget.clientId,
                equipamentId: budget.equipamentId,
                validity: budget.validity,
                warranty: budget.warranty,
                deliveryTime: budget.deliveryTime,
                paymentCondition: budget.paymentCondition,
                observations: budget.observations,
                status: budget.status,
                createdAt: budget.createdAt,
                updatedAt: budget.updatedAt
            },
            client: budget.client,
            equipament: budget.equipament,
            totals: {
                itemCount: budget.items.length,
                categoryCount: groupedItems.length,
                grossAmount: toNumber(grossAmount),
                itemDiscountAmount: toNumber(itemDiscountAmount),
                totalAmount,
                globalDiscount,
                globalDiscountAmount: toNumber(globalDiscountAmount),
                finalAmount
            },
            items: {
                total: budget.items.length,
                categories: groupedItems
            },
            history: budget.history
        }
    }

    async findBudgetDashboard(filters: BudgetDashboardQueryDTO) {
        const result = await budgetQueriesRepository.findBudgetDashboard(filters)
        const statusCounts: Record<string, number> = Object.fromEntries(
            allowedBudgetStatus.map(status => [status, 0])
        )
        const statusTotals = Object.fromEntries(
            allowedBudgetStatus.map(status => [status, {
                count: 0,
                totalAmount: 0,
                finalAmount: 0
            }])
        ) as Record<string, { count: number; totalAmount: number; finalAmount: number }>

        for (const group of result.statusGroups) {
            statusCounts[group.status] = group.count
            statusTotals[group.status] = {
                count: group.count,
                totalAmount: toNumber(group.totalAmount),
                finalAmount: toNumber(group.finalAmount)
            }
        }

        const openFinalAmount = result.statusGroups
            .filter(group => ['rascunho', 'enviado'].includes(group.status))
            .reduce((total, group) => total.plus(group.finalAmount), new Prisma.Decimal(0))

        return {
            period: {
                year: filters.year,
                month: filters.month,
                dateBasis: 'createdAt'
            },
            budgetCount: result.budgetCount,
            statusCounts,
            statusTotals,
            open: {
                statuses: ['rascunho', 'enviado'],
                count: result.openBudgetCount,
                finalAmount: toNumber(openFinalAmount),
                pagination: {
                    page: filters.page,
                    limit: filters.limit,
                    total: result.openBudgetCount,
                    totalPages: Math.ceil(result.openBudgetCount / filters.limit)
                },
                budgets: result.openBudgets.map(budget => ({
                    ...budget,
                    finalAmount: toNumber(budget.finalAmount),
                    itemCount: budget._count.items
                })).map(({ _count, ...budget }) => budget)
            },
            financialNote: 'Valores representam os totais dos orçamentos cadastrados no período, não receitas realizadas.'
        }
    }

    async findBudgetYearlyMetrics(filters: BudgetMetricsQueryDTO) {
        const groups = await budgetQueriesRepository.findBudgetYearlyMetrics(filters)
        const monthly = Array.from({ length: 12 }, (_, index) => ({
            month: index + 1,
            budgetCount: 0,
            statusCounts: Object.fromEntries(allowedBudgetStatus.map(status => [status, 0])) as Record<string, number>,
            statusTotals: Object.fromEntries(allowedBudgetStatus.map(status => [status, {
                count: 0,
                totalAmount: 0,
                finalAmount: 0
            }])) as Record<string, { count: number; totalAmount: number; finalAmount: number }>,
            totalAmount: new Prisma.Decimal(0),
            finalAmount: new Prisma.Decimal(0)
        }))

        for (const group of groups) {
            const month = monthly[group.month - 1]
            if (!month) continue

            const totalAmount = new Prisma.Decimal(group.totalAmount)
            const finalAmount = new Prisma.Decimal(group.finalAmount)
            month.budgetCount += group.budgetCount
            month.statusCounts[group.status] = group.budgetCount
            month.statusTotals[group.status] = {
                count: group.budgetCount,
                totalAmount: toNumber(totalAmount),
                finalAmount: toNumber(finalAmount)
            }
            month.totalAmount = month.totalAmount.plus(totalAmount)
            month.finalAmount = month.finalAmount.plus(finalAmount)
        }

        const annual = monthly.reduce((total, month) => ({
            budgetCount: total.budgetCount + month.budgetCount,
            totalAmount: total.totalAmount.plus(month.totalAmount),
            finalAmount: total.finalAmount.plus(month.finalAmount)
        }), {
            budgetCount: 0,
            totalAmount: new Prisma.Decimal(0),
            finalAmount: new Prisma.Decimal(0)
        })

        const statusTotals = Object.fromEntries(allowedBudgetStatus.map(status => [status, {
            count: monthly.reduce((total, month) => total + month.statusCounts[status]!, 0),
            totalAmount: monthly.reduce(
                (total, month) => total.plus(month.statusTotals[status]!.totalAmount),
                new Prisma.Decimal(0)
            ).toNumber(),
            finalAmount: monthly.reduce(
                (total, month) => total.plus(month.statusTotals[status]!.finalAmount),
                new Prisma.Decimal(0)
            ).toNumber()
        }]))

        return {
            year: filters.year,
            dateBasis: 'createdAt',
            annual: {
                budgetCount: annual.budgetCount,
                totalAmount: annual.totalAmount.toNumber(),
                finalAmount: annual.finalAmount.toNumber()
            },
            statusTotals,
            monthly: monthly.map(month => ({
                ...month,
                totalAmount: month.totalAmount.toNumber(),
                finalAmount: month.finalAmount.toNumber()
            })),
            interpretation: 'Valores representam orçamentos cadastrados no ano. Não representam faturamento, recebimentos ou receita realizada.'
        }
    }

    findBudgetsByAdvancedFilters(filters: FindBudgetsByAdvancedFiltersDTO) {
        return budgetQueriesRepository.findBudgetsByAdvancedFilters(filters)
    }
}

export default new BudgetQueriesService()
