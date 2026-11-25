import { prisma } from '../../../../shared/database/prisma.js'
import type { monthlyPaymentsQueryDTO } from '../queries.schema.js'

class MonthlyPaymentsRepository {
    async findMonthlyPayments(query: monthlyPaymentsQueryDTO) {
        const startDate = new Date(Date.UTC(query.year, query.month - 1, 1))
        const nextMonthStart = new Date(Date.UTC(query.year, query.month, 1))
        const where = {
            type: 'pagamento',
            eventDate: { gte: startDate, lt: nextMonthStart },
            ...(query.engagementId ? { engagementId: query.engagementId } : {}),
            ...(query.employeeId ? { engagement: { is: { employeeId: query.employeeId } } } : {})
        }

        if (query.cursor) {
            const cursor = await prisma.employeeMovement.findFirst({
                where: { ...where, id: query.cursor }, select: { id: true }
            })
            if (!cursor) return { invalidCursor: true as const }
        }

        const rows = await prisma.employeeMovement.findMany({
            where,
            ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
            take: query.limit + 1,
            orderBy: [{ eventDate: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }, { id: 'desc' }],
            select: {
                id: true, engagementId: true, description: true, eventDate: true, value: true,
                obligationId: true, financialTransactionId: true, createdAt: true,
                engagement: { select: { employee: { select: { id: true, name: true } } } },
                obligation: { select: { id: true, type: true, title: true, referenceStart: true, referenceEnd: true } },
                financialTransaction: { select: { id: true, description: true, referenceDate: true, value: true } }
            }
        })

        const [totalCount, totalValue] = await Promise.all([
            prisma.employeeMovement.count({ where }),
            prisma.employeeMovement.aggregate({ where, _sum: { value: true } })
        ])
        const hasMore = rows.length > query.limit
        const page = hasMore ? rows.slice(0, query.limit) : rows
        return {
            period: { month: query.month, year: query.year, startDate, endDate: new Date(nextMonthStart.getTime() - 1) },
            data: page.map(item => ({
                ...item,
                value: item.value === null ? null : Number(item.value),
                financialTransaction: item.financialTransaction
                    ? { ...item.financialTransaction, value: Number(item.financialTransaction.value) }
                    : null
            })),
            totals: { count: totalCount, value: Number(totalValue._sum.value ?? 0) },
            pagination: { limit: query.limit, hasMore, nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null }
        }
    }
}

export default new MonthlyPaymentsRepository()
