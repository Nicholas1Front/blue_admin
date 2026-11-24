import { prisma } from '../../../shared/database/prisma.js'
import type { employeeOverviewQueryDTO } from './queries.schema.js'

const toPage = <T extends { id: string }>(items: T[], limit: number) => {
    const hasMore = items.length > limit
    const data = hasMore ? items.slice(0, limit) : items
    return {
        data,
        pagination: {
            limit,
            hasMore,
            nextCursor: hasMore ? data[data.length - 1]?.id ?? null : null
        }
    }
}

class EmployeesQueriesRepository {
    async findEmployeeOverview(employeeId: string, query: employeeOverviewQueryDTO) {
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            select: {
                id: true,
                name: true,
                document: true,
                observations: true,
                createdAt: true,
                updatedAt: true,
                engagements: {
                    orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }],
                    select: {
                        id: true,
                        entryDate: true,
                        exitDate: true,
                        status: true,
                        currentSalary: true,
                        hourlyRate: true,
                        modality: true,
                        observations: true,
                        createdAt: true,
                        updatedAt: true
                    }
                }
            }
        })

        if (!employee) return null

        const engagementIds = employee.engagements.map(engagement => engagement.id)
        const [obligationCursor, movementCursor, historyCursor] = await Promise.all([
            query.obligationsCursor
                ? prisma.employeeObligation.findFirst({
                    where: { id: query.obligationsCursor, engagementId: { in: engagementIds } },
                    select: { id: true }
                })
                : null,
            query.movementsCursor
                ? prisma.employeeMovement.findFirst({
                    where: { id: query.movementsCursor, engagementId: { in: engagementIds } },
                    select: { id: true }
                })
                : null,
            query.historyCursor
                ? prisma.employeeHistory.findFirst({
                    where: { id: query.historyCursor, employeeId },
                    select: { id: true }
                })
                : null
        ])
        if (
            (query.obligationsCursor && !obligationCursor) ||
            (query.movementsCursor && !movementCursor) ||
            (query.historyCursor && !historyCursor)
        ) return { invalidCursor: true as const }
        const obligationLimit = query.obligationsLimit
        const movementLimit = query.movementsLimit
        const historyLimit = query.historyLimit

        const [obligationRows, movementRows, historyRows] = await Promise.all([
            engagementIds.length
                ? prisma.employeeObligation.findMany({
                    where: { engagementId: { in: engagementIds } },
                    ...(query.obligationsCursor ? { cursor: { id: query.obligationsCursor }, skip: 1 } : {}),
                    take: obligationLimit + 1,
                    orderBy: [
                        { referenceStart: 'desc' },
                        { dueDate: 'asc' },
                        { createdAt: 'desc' },
                        { id: 'desc' }
                    ],
                    select: {
                        id: true,
                        engagementId: true,
                        type: true,
                        title: true,
                        description: true,
                        referenceStart: true,
                        referenceEnd: true,
                        dueDate: true,
                        originalValue: true,
                        finalValue: true,
                        status: true,
                        observations: true,
                        createdAt: true,
                        updatedAt: true
                    }
                })
                : [],
            engagementIds.length
                ? prisma.employeeMovement.findMany({
                    where: { engagementId: { in: engagementIds } },
                    ...(query.movementsCursor ? { cursor: { id: query.movementsCursor }, skip: 1 } : {}),
                    take: movementLimit + 1,
                    orderBy: [
                        { eventDate: 'desc' },
                        { createdAt: 'desc' },
                        { id: 'desc' }
                    ],
                    select: {
                        id: true,
                        engagementId: true,
                        type: true,
                        description: true,
                        eventDate: true,
                        referenceStart: true,
                        referenceEnd: true,
                        value: true,
                        obligationId: true,
                        financialTransactionId: true,
                        observations: true,
                        createdAt: true,
                        updatedAt: true,
                        obligation: {
                            select: {
                                id: true,
                                type: true,
                                title: true,
                                referenceStart: true,
                                referenceEnd: true,
                                dueDate: true,
                                status: true
                            }
                        },
                        financialTransaction: {
                            select: {
                                id: true,
                                description: true,
                                value: true,
                                type: true,
                                referenceDate: true,
                                categoryId: true
                            }
                        }
                    }
                })
                : [],
            prisma.employeeHistory.findMany({
                where: { employeeId },
                ...(query.historyCursor ? { cursor: { id: query.historyCursor }, skip: 1 } : {}),
                take: historyLimit + 1,
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                select: {
                    id: true,
                    engagementId: true,
                    eventType: true,
                    description: true,
                    metadata: true,
                    eventDate: true,
                    createdAt: true
                }
            })
        ])

        const obligationsPage = toPage(obligationRows, obligationLimit)
        const movementsPage = toPage(movementRows, movementLimit)
        const historyPage = toPage(historyRows, historyLimit)

        const obligationIds = obligationsPage.data.map(obligation => obligation.id)
        const paymentTotals = obligationIds.length
            ? await prisma.employeeMovement.groupBy({
                by: ['obligationId'],
                where: {
                    obligationId: { in: obligationIds },
                    type: 'pagamento'
                },
                _sum: { value: true }
            })
            : []

        const paidByObligation = new Map(
            paymentTotals.map(item => [item.obligationId, Number(item._sum.value ?? 0)])
        )

        const obligations = obligationsPage.data.map(obligation => {
            const paidValue = paidByObligation.get(obligation.id) ?? 0
            const finalValue = Number(obligation.finalValue)
            return {
                ...obligation,
                originalValue: Number(obligation.originalValue),
                finalValue,
                paidValue,
                outstandingValue: Math.max(0, Number((finalValue - paidValue).toFixed(2)))
            }
        })

        const groupByEngagement = <T extends { engagementId: string }>(items: T[]) => {
            const groups = new Map<string, T[]>()
            for (const item of items) {
                const group = groups.get(item.engagementId) ?? []
                group.push(item)
                groups.set(item.engagementId, group)
            }
            return Object.fromEntries(groups)
        }

        const movements = movementsPage.data.map(movement => ({
            ...movement,
            value: movement.value === null ? null : Number(movement.value),
            financialTransaction: movement.financialTransaction
                ? { ...movement.financialTransaction, value: Number(movement.financialTransaction.value) }
                : null
        }))

        return {
            employee: {
                id: employee.id,
                name: employee.name,
                document: employee.document,
                observations: employee.observations,
                createdAt: employee.createdAt,
                updatedAt: employee.updatedAt
            },
            engagements: employee.engagements.map(engagement => ({
                ...engagement,
                currentSalary: engagement.currentSalary === null ? null : Number(engagement.currentSalary),
                hourlyRate: engagement.hourlyRate === null ? null : Number(engagement.hourlyRate)
            })),
            obligations: {
                byEngagement: groupByEngagement(obligations),
                pagination: obligationsPage.pagination
            },
            movements: {
                byEngagement: groupByEngagement(movements),
                pagination: movementsPage.pagination
            },
            history: {
                employee: historyPage.data.filter(item => item.engagementId === null),
                byEngagement: Object.fromEntries(
                    employee.engagements.map(engagement => [
                        engagement.id,
                        historyPage.data.filter(item => item.engagementId === engagement.id)
                    ])
                ),
                pagination: historyPage.pagination
            }
        }
    }
}

export default new EmployeesQueriesRepository()
