import { prisma } from '../../../shared/database/prisma.js'
import type { employeeDashboardQueryDTO } from './dashboard.schema.js'

class EmployeesDashboardRepository {
    async findDashboard(query: employeeDashboardQueryDTO) {
        const now = new Date()
        const year = query.year ?? now.getUTCFullYear()
        const month = query.month ?? now.getUTCMonth() + 1
        const monthStart = new Date(Date.UTC(year, month - 1, 1))
        const nextMonthStart = new Date(Date.UTC(year, month, 1))
        const monthEnd = new Date(nextMonthStart.getTime() - 1)
        const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

        const employees = await prisma.employee.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                engagements: {
                    select: { id: true }
                }
            }
        })
        const engagementIds = employees.flatMap(employee => employee.engagements.map(item => item.id))

        if (query.movementsCursor) {
            const cursorExists = engagementIds.length
                ? await prisma.employeeMovement.findFirst({
                    where: { id: query.movementsCursor, engagementId: { in: engagementIds } },
                    select: { id: true }
                })
                : null
            if (!cursorExists) return { invalidCursor: true as const }
        }

        const [obligations, paymentTotals, movementCounts, monthlyPayments, recentRows] = await Promise.all([
            engagementIds.length
                ? prisma.employeeObligation.findMany({
                    where: {
                        engagementId: { in: engagementIds },
                        status: { in: ['pendente', 'parcial'] }
                    },
                    select: {
                        id: true,
                        engagementId: true,
                        type: true,
                        title: true,
                        referenceStart: true,
                        referenceEnd: true,
                        dueDate: true,
                        finalValue: true,
                        status: true
                    }
                })
                : [],
            engagementIds.length
                ? prisma.employeeMovement.groupBy({
                    by: ['obligationId'],
                    where: {
                        type: 'pagamento',
                        obligationId: { not: null },
                        obligation: { is: { engagementId: { in: engagementIds } } }
                    },
                    _sum: { value: true }
                })
                : [],
            engagementIds.length
                ? prisma.employeeMovement.groupBy({
                    by: ['engagementId', 'type'],
                    where: {
                        engagementId: { in: engagementIds },
                        type: { in: ['falta', 'atraso'] },
                        eventDate: { gte: monthStart, lt: nextMonthStart }
                    },
                    _count: { _all: true }
                })
                : [],
            engagementIds.length
                ? prisma.employeeMovement.groupBy({
                    by: ['engagementId'],
                    where: {
                        engagementId: { in: engagementIds },
                        type: 'pagamento',
                        eventDate: { gte: monthStart, lt: nextMonthStart }
                    },
                    _sum: { value: true }
                })
                : [],
            engagementIds.length
                ? prisma.employeeMovement.findMany({
                    where: { engagementId: { in: engagementIds } },
                    ...(query.movementsCursor ? { cursor: { id: query.movementsCursor }, skip: 1 } : {}),
                    take: query.movementsLimit + 1,
                    orderBy: [{ eventDate: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
                    select: {
                        id: true,
                        engagementId: true,
                        type: true,
                        description: true,
                        eventDate: true,
                        value: true,
                        obligationId: true,
                        financialTransactionId: true,
                        createdAt: true,
                        engagement: {
                            select: {
                                employee: { select: { id: true, name: true } }
                            }
                        },
                        obligation: {
                            select: {
                                id: true,
                                type: true,
                                title: true,
                                referenceStart: true,
                                referenceEnd: true,
                                dueDate: true
                            }
                        },
                        financialTransaction: {
                            select: { id: true, description: true, referenceDate: true, value: true }
                        }
                    }
                })
                : []
        ])



        const paidByObligation = new Map(
            paymentTotals.map(item => [item.obligationId, Number(item._sum.value ?? 0)] as const)
        )
        const employeeByEngagement = new Map<string, string>()
        for (const employee of employees) {
            for (const engagement of employee.engagements) employeeByEngagement.set(engagement.id, employee.id)
        }

        const summaries = new Map(employees.map(employee => [employee.id, {
            employeeId: employee.id,
            name: employee.name,
            totalOpenValue: 0,
            obligationsDueThisMonth: 0,
            dueThisMonthValue: 0,
            overdueValue: 0,
            paymentsRecordedThisMonth: 0,
            absencesThisMonth: 0,
            tardinessThisMonth: 0
        } ] as const))

        const openObligations = obligations.map(obligation => {
            const paidValue = paidByObligation.get(obligation.id) ?? 0
            const finalValue = Number(obligation.finalValue)
            const outstandingValue = Math.max(0, Number((finalValue - paidValue).toFixed(2)))
            const employeeId = employeeByEngagement.get(obligation.engagementId)
            const summary = employeeId ? summaries.get(employeeId) : undefined
            if (summary && outstandingValue > 0) {
                summary.totalOpenValue += outstandingValue
                if (obligation.dueDate && obligation.dueDate >= monthStart && obligation.dueDate < nextMonthStart) {
                    summary.obligationsDueThisMonth += 1
                    summary.dueThisMonthValue += outstandingValue
                }
                if (obligation.dueDate && obligation.dueDate < todayStart) {
                    summary.overdueValue += outstandingValue
                }
            }
            return {
                ...obligation,
                finalValue,
                paidValue,
                outstandingValue
            }
        }).filter(obligation => obligation.outstandingValue > 0)

        for (const payment of monthlyPayments) {
            const employeeId = employeeByEngagement.get(payment.engagementId)
            const summary = employeeId ? summaries.get(employeeId) : undefined
            if (summary) summary.paymentsRecordedThisMonth += Number(payment._sum.value ?? 0)
        }

        for (const movement of movementCounts) {
            const employeeId = employeeByEngagement.get(movement.engagementId)
            const summary = employeeId ? summaries.get(employeeId) : undefined
            if (!summary) continue
            if (movement.type === 'falta') summary.absencesThisMonth += movement._count._all
            if (movement.type === 'atraso') summary.tardinessThisMonth += movement._count._all
        }

        const recentHasMore = recentRows.length > query.movementsLimit
        const recentData = recentHasMore ? recentRows.slice(0, query.movementsLimit) : recentRows
        const currentMonth = year === now.getUTCFullYear() && month === now.getUTCMonth() + 1
        const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
        const daysRemaining = currentMonth ? Math.max(0, daysInMonth - now.getUTCDate()) : 0
        const nextObligation = openObligations
            .filter(item => item.dueDate && item.dueDate >= todayStart)
            .sort((a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0))[0] ?? null

        const totalOpenValue = openObligations.reduce((sum, item) => sum + item.outstandingValue, 0)
        const dueThisMonth = openObligations.filter(item =>
            item.dueDate && item.dueDate >= monthStart && item.dueDate < nextMonthStart
        )
        const overdueValue = openObligations
            .filter(item => item.dueDate && item.dueDate < todayStart)
            .reduce((sum, item) => sum + item.outstandingValue, 0)
        const paymentsRecordedThisMonth = [...summaries.values()]
            .reduce((sum, item) => sum + item.paymentsRecordedThisMonth, 0)

        return {
            period: { month, year, startDate: monthStart, endDate: monthEnd, daysRemaining },
            totals: {
                employees: employees.length,
                openObligations: openObligations.length,
                totalOpenValue,
                obligationsDueThisMonth: dueThisMonth.length,
                dueThisMonthValue: dueThisMonth.reduce((sum, item) => sum + item.outstandingValue, 0),
                overdueValue,
                paymentsRecordedThisMonth
            },
            nextObligation,
            employees: [...summaries.values()],
            obligationsDueThisMonth: dueThisMonth,
            overdueObligations: openObligations.filter(item => item.dueDate && item.dueDate < todayStart),
            recentMovements: {
                data: recentData.map(item => ({
                    ...item,
                    value: item.value === null ? null : Number(item.value),
                    financialTransaction: item.financialTransaction
                        ? { ...item.financialTransaction, value: Number(item.financialTransaction.value) }
                        : null
                })),
                pagination: {
                    limit: query.movementsLimit,
                    hasMore: recentHasMore,
                    nextCursor: recentHasMore ? recentData[recentData.length - 1]?.id ?? null : null
                }
            }
        }
    }
}

export default new EmployeesDashboardRepository()
