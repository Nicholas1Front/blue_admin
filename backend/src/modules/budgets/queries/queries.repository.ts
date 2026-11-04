import { Prisma } from '../../../generated/prisma/client.js'
import { prisma } from '../../../shared/database/prisma.js'
import type {
    BudgetDashboardQueryDTO,
    BudgetMetricsQueryDTO,
    FindBudgetsByAdvancedFiltersDTO
} from './queries.schema.js'

const utcDate = (year: number, month: number) => {
    const date = new Date(0)
    date.setUTCFullYear(year, month, 1)
    date.setUTCHours(0, 0, 0, 0)
    return date
}

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

const contains = (value: string) => ({ contains: value, mode: 'insensitive' as const })

class BudgetQueriesRepository {
    findBudgetDetailsById(id: string) {
        return prisma.budget.findUnique({
            where: { id },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        document: true,
                        address: true
                    }
                },
                equipament: {
                    select: {
                        id: true,
                        type: true,
                        brand: true,
                        model: true,
                        mainIdentification: true,
                        additionalIdentification: true
                    }
                },
                history: {
                    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
                },
                items: {
                    include: {
                        category: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                isActive: true
                            }
                        }
                    },
                    orderBy: [
                        { category: { name: 'asc' } },
                        { createdAt: 'asc' },
                        { id: 'asc' }
                    ]
                }
            }
        })
    }

    async findBudgetDashboard(filters: BudgetDashboardQueryDTO) {
        const startDate = utcDate(filters.year, filters.month - 1)
        const endDate = utcDate(filters.year, filters.month)
        const periodWhere: Prisma.BudgetWhereInput = {
            createdAt: { gte: startDate, lt: endDate }
        }
        const openStatuses = ['rascunho', 'enviado']

        const [budgetCount, statusGroups, openBudgetCount, openBudgets] = await Promise.all([
            prisma.budget.count({ where: periodWhere }),
            prisma.budget.groupBy({
                by: ['status'],
                where: periodWhere,
                _count: { _all: true },
                _sum: { totalAmount: true, finalAmount: true }
            }),
            prisma.budget.count({
                where: { ...periodWhere, status: { in: openStatuses } }
            }),
            prisma.budget.findMany({
                where: { ...periodWhere, status: { in: openStatuses } },
                select: {
                    id: true,
                    status: true,
                    finalAmount: true,
                    createdAt: true,
                    updatedAt: true,
                    client: { select: { id: true, name: true } },
                    equipament: {
                        select: {
                            id: true,
                            type: true,
                            brand: true,
                            model: true,
                            mainIdentification: true,
                            additionalIdentification: true
                        }
                    },
                    _count: { select: { items: true } }
                },
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                skip: (filters.page - 1) * filters.limit,
                take: filters.limit
            })
        ])

        return {
            budgetCount,
            statusGroups: statusGroups.map(group => ({
                status: group.status,
                count: group._count._all,
                totalAmount: group._sum.totalAmount ?? new Prisma.Decimal(0),
                finalAmount: group._sum.finalAmount ?? new Prisma.Decimal(0)
            })),
            openBudgetCount,
            openBudgets
        }
    }

    async findBudgetYearlyMetrics(filters: BudgetMetricsQueryDTO) {
        const startDate = utcDate(filters.year, 0)
        const endDate = utcDate(filters.year + 1, 0)

        return prisma.$queryRaw<Array<{ month: number; status: string; budgetCount: number }>>`
            SELECT
                EXTRACT(MONTH FROM created_at)::int AS month,
                status,
                COUNT(*)::int AS "budgetCount"
            FROM budgets
            WHERE created_at >= ${startDate}
              AND created_at < ${endDate}
            GROUP BY EXTRACT(MONTH FROM created_at), status
            ORDER BY month ASC, status ASC
        `
    }

    async findBudgetsByAdvancedFilters(filters: FindBudgetsByAdvancedFiltersDTO) {
        const createdAt = toDateRange(filters.createdAtFrom, filters.createdAtTo)
        const updatedAt = toDateRange(filters.updatedAtFrom, filters.updatedAtTo)
        const historyCreatedAt = toDateRange(filters.historyCreatedAtFrom, filters.historyCreatedAtTo)

        const andFilters: Prisma.BudgetWhereInput[] = []

        if (filters.budgetId !== undefined) andFilters.push({ id: contains(filters.budgetId) })
        if (filters.clientId !== undefined) andFilters.push({ clientId: filters.clientId })
        if (filters.clientName !== undefined) {
            andFilters.push({ client: { is: { name: contains(filters.clientName) } } })
        }
        if (filters.clientDocument !== undefined) {
            andFilters.push({ client: { is: { document: contains(filters.clientDocument) } } })
        }
        if (filters.equipamentId !== undefined) andFilters.push({ equipamentId: filters.equipamentId })
        if (filters.equipamentSearch !== undefined) {
            andFilters.push({
                equipament: {
                    is: {
                        OR: [
                            { type: contains(filters.equipamentSearch) },
                            { brand: contains(filters.equipamentSearch) },
                            { model: contains(filters.equipamentSearch) },
                            { mainIdentification: contains(filters.equipamentSearch) },
                            { additionalIdentification: contains(filters.equipamentSearch) }
                        ]
                    }
                }
            })
        }

        if (filters.status !== undefined) andFilters.push({ status: contains(filters.status) })
        if (filters.paymentCondition !== undefined) andFilters.push({ paymentCondition: contains(filters.paymentCondition) })
        if (filters.validity !== undefined) andFilters.push({ validity: contains(filters.validity) })
        if (filters.warranty !== undefined) andFilters.push({ warranty: contains(filters.warranty) })
        if (filters.deliveryTime !== undefined) andFilters.push({ deliveryTime: contains(filters.deliveryTime) })
        if (filters.observations !== undefined) andFilters.push({ observations: contains(filters.observations) })

        if (
            filters.totalAmountMin !== undefined ||
            filters.totalAmountMax !== undefined
        ) {
            andFilters.push({
                totalAmount: {
                    ...(filters.totalAmountMin !== undefined && { gte: new Prisma.Decimal(filters.totalAmountMin) }),
                    ...(filters.totalAmountMax !== undefined && { lte: new Prisma.Decimal(filters.totalAmountMax) })
                }
            })
        }
        if (
            filters.globalDiscountMin !== undefined ||
            filters.globalDiscountMax !== undefined
        ) {
            andFilters.push({
                globalDiscount: {
                    ...(filters.globalDiscountMin !== undefined && { gte: new Prisma.Decimal(filters.globalDiscountMin) }),
                    ...(filters.globalDiscountMax !== undefined && { lte: new Prisma.Decimal(filters.globalDiscountMax) })
                }
            })
        }
        if (
            filters.finalAmountMin !== undefined ||
            filters.finalAmountMax !== undefined
        ) {
            andFilters.push({
                finalAmount: {
                    ...(filters.finalAmountMin !== undefined && { gte: new Prisma.Decimal(filters.finalAmountMin) }),
                    ...(filters.finalAmountMax !== undefined && { lte: new Prisma.Decimal(filters.finalAmountMax) })
                }
            })
        }
        if (createdAt !== undefined) andFilters.push({ createdAt })
        if (updatedAt !== undefined) andFilters.push({ updatedAt })

        const itemWhere: Prisma.BudgetItemWhereInput = {
            ...(filters.itemId !== undefined && { id: contains(filters.itemId) }),
            ...(filters.itemTitle !== undefined && { title: contains(filters.itemTitle) }),
            ...(filters.itemDescription !== undefined && { description: contains(filters.itemDescription) }),
            ...(filters.itemCategoryId !== undefined && { categoryId: filters.itemCategoryId }),
            ...(filters.itemCategoryName !== undefined && {
                category: { is: { name: contains(filters.itemCategoryName) } }
            }),
            ...((filters.itemQuantityMin !== undefined || filters.itemQuantityMax !== undefined) && {
                quantity: {
                    ...(filters.itemQuantityMin !== undefined && { gte: new Prisma.Decimal(filters.itemQuantityMin) }),
                    ...(filters.itemQuantityMax !== undefined && { lte: new Prisma.Decimal(filters.itemQuantityMax) })
                }
            }),
            ...((filters.itemUnitValueMin !== undefined || filters.itemUnitValueMax !== undefined) && {
                unitValue: {
                    ...(filters.itemUnitValueMin !== undefined && { gte: new Prisma.Decimal(filters.itemUnitValueMin) }),
                    ...(filters.itemUnitValueMax !== undefined && { lte: new Prisma.Decimal(filters.itemUnitValueMax) })
                }
            }),
            ...((filters.itemTotalAmountMin !== undefined || filters.itemTotalAmountMax !== undefined) && {
                totalAmount: {
                    ...(filters.itemTotalAmountMin !== undefined && { gte: new Prisma.Decimal(filters.itemTotalAmountMin) }),
                    ...(filters.itemTotalAmountMax !== undefined && { lte: new Prisma.Decimal(filters.itemTotalAmountMax) })
                }
            }),
            ...((filters.itemDiscountMin !== undefined || filters.itemDiscountMax !== undefined) && {
                discount: {
                    ...(filters.itemDiscountMin !== undefined && { gte: new Prisma.Decimal(filters.itemDiscountMin) }),
                    ...(filters.itemDiscountMax !== undefined && { lte: new Prisma.Decimal(filters.itemDiscountMax) })
                }
            })
        }
        if (Object.keys(itemWhere).length > 0) andFilters.push({ items: { some: itemWhere } })

        const historyWhere: Prisma.BudgetHistoryWhereInput = {
            ...(filters.historyId !== undefined && { id: contains(filters.historyId) }),
            ...(filters.historyEventType !== undefined && { eventType: contains(filters.historyEventType) }),
            ...(filters.historyDescription !== undefined && { description: contains(filters.historyDescription) }),
            ...(historyCreatedAt !== undefined && { createdAt: historyCreatedAt })
        }
        if (Object.keys(historyWhere).length > 0) andFilters.push({ history: { some: historyWhere } })

        if (filters.search !== undefined) {
            andFilters.push({
                OR: [
                    { id: contains(filters.search) },
                    { observations: contains(filters.search) },
                    { client: { is: { name: contains(filters.search) } } },
                    { client: { is: { document: contains(filters.search) } } },
                    {
                        equipament: {
                            is: {
                                OR: [
                                    { type: contains(filters.search) },
                                    { brand: contains(filters.search) },
                                    { model: contains(filters.search) },
                                    { mainIdentification: contains(filters.search) },
                                    { additionalIdentification: contains(filters.search) }
                                ]
                            }
                        }
                    },
                    {
                        items: {
                            some: {
                                OR: [
                                    { title: contains(filters.search) },
                                    { description: contains(filters.search) },
                                    { category: { is: { name: contains(filters.search) } } }
                                ]
                            }
                        }
                    },
                    {
                        history: {
                            some: {
                                OR: [
                                    { eventType: contains(filters.search) },
                                    { description: contains(filters.search) }
                                ]
                            }
                        }
                    }
                ]
            })
        }

        const where: Prisma.BudgetWhereInput = andFilters.length > 0 ? { AND: andFilters } : {}
        const [budgets, total] = await Promise.all([
            prisma.budget.findMany({
                where,
                select: {
                    id: true,
                    clientId: true,
                    equipamentId: true,
                    status: true,
                    validity: true,
                    warranty: true,
                    deliveryTime: true,
                    paymentCondition: true,
                    totalAmount: true,
                    globalDiscount: true,
                    finalAmount: true,
                    createdAt: true,
                    updatedAt: true,
                    client: { select: { id: true, name: true, document: true } },
                    equipament: {
                        select: {
                            id: true,
                            type: true,
                            brand: true,
                            model: true,
                            mainIdentification: true,
                            additionalIdentification: true
                        }
                    },
                    _count: { select: { items: true } }
                },
                skip: (filters.page - 1) * filters.limit,
                take: filters.limit,
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
            }),
            prisma.budget.count({ where })
        ])

        return {
            budgets: budgets.map(budget => ({
                ...budget,
                totalAmount: Number(budget.totalAmount),
                globalDiscount: Number(budget.globalDiscount),
                finalAmount: Number(budget.finalAmount)
            })),
            page: filters.page,
            limit: filters.limit,
            total,
            totalPages: Math.ceil(total / filters.limit)
        }
    }
}

export default new BudgetQueriesRepository()
