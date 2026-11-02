import { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../../shared/database/prisma.js'
import { AppError } from '../../shared/errors/AppError.js'
import type { FindBudgetsByFiltersDTO } from './budgets.schema.js'

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

class BudgetRepository {
    clientExists(id: string) {
        return prisma.client.findUnique({ where: { id }, select: { id: true } })
    }

    clientHasEquipament(clientId: string, equipamentId: string) {
        return prisma.equipament.findFirst({
            where: { id: equipamentId, clientId },
            select: { id: true }
        })
    }

    findServiceForConversion(serviceId: string, activityIds: string[], categoryIds: string[]) {
        return Promise.all([
            prisma.service.findUnique({
                where: { id: serviceId },
                select: { id: true, clientId: true, equipamentId: true }
            }),
            prisma.serviceActivity.findMany({
                where: { serviceId, id: { in: activityIds } },
                select: { id: true, title: true, description: true }
            }),
            prisma.budgetCategory.findMany({
                where: { id: { in: categoryIds } },
                select: { id: true, isActive: true }
            })
        ]).then(([service, activities, categories]) => ({ service, activities, categories }))
    }

    createFromService(
        serviceId: string,
        items: Array<{ activityId: string; budgetCategoryId: string }>,
        requestedAt: Date
    ) {
        return prisma.$transaction(async tx => {
            const service = await tx.service.findUnique({
                where: { id: serviceId },
                select: { id: true, clientId: true, equipamentId: true }
            })
            if (!service) throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND')

            const activityIds = items.map(item => item.activityId)
            const categoryIds = [...new Set(items.map(item => item.budgetCategoryId))]

            const [activities, categories] = await Promise.all([
                tx.serviceActivity.findMany({
                    where: { serviceId, id: { in: activityIds } },
                    select: { id: true, title: true, description: true }
                }),
                tx.budgetCategory.findMany({
                    where: { id: { in: categoryIds } },
                    select: { id: true, isActive: true }
                })
            ])

            if (activities.length !== items.length) {
                throw new AppError(
                    'One or more activities were not found or do not belong to this service',
                    400,
                    'INVALID_SERVICE_ACTIVITIES'
                )
            }
            if (categories.length !== categoryIds.length) {
                throw new AppError('One or more budget categories were not found', 404, 'BUDGET_CATEGORY_NOT_FOUND')
            }
            if (categories.some(category => !category.isActive)) {
                throw new AppError(
                    'Inactive categories cannot be used in new budget items',
                    400,
                    'BUDGET_CATEGORY_INACTIVE'
                )
            }

            const activitiesById = new Map(activities.map(activity => [activity.id, activity]))
            const budget = await tx.budget.create({
                data: {
                    clientId: service.clientId,
                    equipamentId: service.equipamentId,
                    status: 'rascunho',
                    totalAmount: new Prisma.Decimal(0),
                    globalDiscount: new Prisma.Decimal(0),
                    finalAmount: new Prisma.Decimal(0),
                    createdAt: requestedAt
                }
            })

            const createdItems = []
            for (const incomingItem of items) {
                const activity = activitiesById.get(incomingItem.activityId)
                if (!activity) {
                    throw new AppError('Service activity not found', 400, 'INVALID_SERVICE_ACTIVITIES')
                }

                const item = await tx.budgetItem.create({
                    data: {
                        budgetId: budget.id,
                        title: activity.title,
                        description: activity.description,
                        categoryId: incomingItem.budgetCategoryId,
                        quantity: new Prisma.Decimal(1),
                        unitValue: new Prisma.Decimal(0),
                        totalAmount: new Prisma.Decimal(0),
                        discount: new Prisma.Decimal(0),
                        createdAt: requestedAt
                    }
                })
                createdItems.push(item)

                await tx.budgetHistory.create({
                    data: {
                        budgetId: budget.id,
                        eventType: 'item_orcamento_criado_servico',
                        description: `Atividade "${activity.title}" (${activity.id}) importada do serviço ${service.id}.`,
                        createdAt: requestedAt
                    }
                })
            }

            const history = await tx.budgetHistory.create({
                data: {
                    budgetId: budget.id,
                    eventType: 'orcamento_criado_servico',
                    description: `Orçamento criado a partir do serviço ${service.id}. ${createdItems.length} atividade(s) importada(s).`,
                    createdAt: requestedAt
                }
            })

            return { budget, items: createdItems, history }
        })
    }

    create(data: {
        clientId: string
        equipamentId: string
        validity: string
        warranty: string
        deliveryTime: string
        paymentCondition: string
        observations?: string | null | undefined
        globalDiscount: number
        status: string
    }) {
        return prisma.$transaction(async tx => {
            const budget = await tx.budget.create({
                data: {
                    clientId: data.clientId,
                    equipamentId: data.equipamentId,
                    validity: data.validity,
                    warranty: data.warranty,
                    deliveryTime: data.deliveryTime,
                    paymentCondition: data.paymentCondition,
                    observations: data.observations ?? null,
                    globalDiscount: new Prisma.Decimal(data.globalDiscount),
                    status: data.status
                }
            })

            await tx.budgetHistory.create({
                data: {
                    budgetId: budget.id,
                    eventType: 'orcamento_criado',
                    description: 'Orçamento criado.'
                }
            })

            return budget
        })
    }

    findById(id: string) {
        return prisma.budget.findUnique({
            where: { id },
            include: { history: { orderBy: { createdAt: 'desc' } } }
        })
    }

    async findByFilters(filters: FindBudgetsByFiltersDTO) {
        const createdAt = toDateRange(filters.createdAtFrom, filters.createdAtTo)
        const updatedAt = toDateRange(filters.updatedAtFrom, filters.updatedAtTo)
        const historyCreatedAt = toDateRange(filters.historyCreatedAtFrom, filters.historyCreatedAtTo)

        const historyWhere: Prisma.BudgetHistoryWhereInput = {
            ...(filters.historyId !== undefined && { id: contains(filters.historyId) }),
            ...(filters.historyEventType !== undefined && { eventType: contains(filters.historyEventType) }),
            ...(filters.historyDescription !== undefined && { description: contains(filters.historyDescription) }),
            ...(historyCreatedAt !== undefined && { createdAt: historyCreatedAt })
        }

        const hasHistoryFilters = Object.keys(historyWhere).length > 0

        const where: Prisma.BudgetWhereInput = {
            ...(filters.id !== undefined && { id: contains(filters.id) }),
            ...(filters.clientId !== undefined && { clientId: filters.clientId }),
            ...(filters.equipamentId !== undefined && { equipamentId: filters.equipamentId }),
            ...(filters.validity !== undefined && { validity: contains(filters.validity) }),
            ...(filters.warranty !== undefined && { warranty: contains(filters.warranty) }),
            ...(filters.deliveryTime !== undefined && { deliveryTime: contains(filters.deliveryTime) }),
            ...(filters.paymentCondition !== undefined && { paymentCondition: contains(filters.paymentCondition) }),
            ...(filters.observations !== undefined && { observations: contains(filters.observations) }),
            ...(filters.status !== undefined && { status: contains(filters.status) }),
            ...((filters.totalAmountMin !== undefined || filters.totalAmountMax !== undefined) && {
                totalAmount: {
                    ...(filters.totalAmountMin !== undefined && { gte: new Prisma.Decimal(filters.totalAmountMin) }),
                    ...(filters.totalAmountMax !== undefined && { lte: new Prisma.Decimal(filters.totalAmountMax) })
                }
            }),
            ...((filters.globalDiscountMin !== undefined || filters.globalDiscountMax !== undefined) && {
                globalDiscount: {
                    ...(filters.globalDiscountMin !== undefined && { gte: new Prisma.Decimal(filters.globalDiscountMin) }),
                    ...(filters.globalDiscountMax !== undefined && { lte: new Prisma.Decimal(filters.globalDiscountMax) })
                }
            }),
            ...((filters.finalAmountMin !== undefined || filters.finalAmountMax !== undefined) && {
                finalAmount: {
                    ...(filters.finalAmountMin !== undefined && { gte: new Prisma.Decimal(filters.finalAmountMin) }),
                    ...(filters.finalAmountMax !== undefined && { lte: new Prisma.Decimal(filters.finalAmountMax) })
                }
            }),
            ...(createdAt !== undefined && { createdAt }),
            ...(updatedAt !== undefined && { updatedAt }),
            ...(hasHistoryFilters && { history: { some: historyWhere } })
        }

        const [budgets, total] = await Promise.all([
            prisma.budget.findMany({
                where,
                skip: (filters.page - 1) * filters.limit,
                take: filters.limit,
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
            }),
            prisma.budget.count({ where })
        ])

        return {
            budgets,
            page: filters.page,
            limit: filters.limit,
            total,
            totalPages: Math.ceil(total / filters.limit)
        }
    }

    update(id: string, data: any, eventDescription: string) {
        return prisma.$transaction(async tx => {
            const current = await tx.budget.findUnique({ where: { id } })
            if (!current) return null

            const aggregate = await tx.budgetItem.aggregate({
                where: { budgetId: id },
                _sum: { totalAmount: true }
            })

            const totalAmount = aggregate._sum.totalAmount ?? new Prisma.Decimal(0)
            const globalDiscount = data.globalDiscount !== undefined
                ? new Prisma.Decimal(data.globalDiscount)
                : current.globalDiscount
            const finalAmount = totalAmount.mul(new Prisma.Decimal(100).minus(globalDiscount)).div(100)

            const budget = await tx.budget.update({
                where: { id },
                data: { ...data, totalAmount, globalDiscount, finalAmount }
            })

            await tx.budgetHistory.create({
                data: {
                    budgetId: id,
                    eventType: data.status !== undefined && data.status !== current.status
                        ? 'status_orcamento_atualizado'
                        : 'orcamento_atualizado',
                    description: eventDescription
                }
            })

            return budget
        })
    }

    delete(id: string) {
        return prisma.budget.delete({ where: { id } })
    }
}

export default new BudgetRepository()
