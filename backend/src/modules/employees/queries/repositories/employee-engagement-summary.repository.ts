import { prisma } from '../../../../shared/database/prisma.js'
import type { employeeSummaryQueryDTO } from '../queries.schema.js'

class EmployeeSummaryRepository {
    async findEmployeeEngagementSummaries(query: employeeSummaryQueryDTO) {
        const now = new Date()
        const month = query.month ?? now.getUTCMonth() + 1
        const year = query.year ?? now.getUTCFullYear()
        const monthStart = new Date(Date.UTC(year, month - 1, 1))
        const nextMonthStart = new Date(Date.UTC(year, month, 1))

        const engagementWhere = {
            ...(query.engagementId ? { id: query.engagementId } : {}),
            ...(query.status ? { status: query.status } : {}),
            ...(query.modality ? { modality: query.modality } : {})
        }
        const where = {
            ...(query.employeeId ? { id: query.employeeId } : {}),
            ...(query.name ? { name: { contains: query.name, mode: 'insensitive' as const } } : {}),
            ...(query.document ? { document: { contains: query.document } } : {}),
            ...(Object.keys(engagementWhere).length ? { engagements: { some: engagementWhere } } : {})
        }

        if (query.cursor) {
            const cursor = await prisma.employee.findFirst({ where: { ...where, id: query.cursor }, select: { id: true } })
            if (!cursor) return { invalidCursor: true as const }
        }

        const rows = await prisma.employee.findMany({
            where,
            ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
            take: query.limit + 1,
            orderBy: [{ name: 'asc' }, { id: 'asc' }],
            select: {
                id: true, name: true, document: true,
                engagements: {
                    where: engagementWhere,
                    orderBy: [{ entryDate: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
                    select: {
                        id: true, status: true, modality: true, entryDate: true, exitDate: true,
                        currentSalary: true,
                        obligations: {
                            where: { status: { in: ['pendente', 'parcial'] } },
                            select: {
                                id: true, type: true, title: true, dueDate: true, finalValue: true, status: true,
                                movements: { where: { type: 'pagamento' }, select: { value: true } }
                            }
                        },
                        movements: {
                            where: { eventDate: { gte: monthStart, lt: nextMonthStart }, type: { in: ['falta', 'atraso'] } },
                            select: { type: true }
                        }
                    }
                }
            }
        })

        const hasMore = rows.length > query.limit
        const page = hasMore ? rows.slice(0, query.limit) : rows
        const data = page.map(employee => ({
            id: employee.id,
            name: employee.name,
            document: employee.document,
            engagements: employee.engagements.map(engagement => {
                const openObligations = engagement.obligations.map(obligation => {
                    const paidValue = obligation.movements.reduce((sum, movement) => sum + Number(movement.value ?? 0), 0)
                    const finalValue = Number(obligation.finalValue)
                    return { id: obligation.id, type: obligation.type, title: obligation.title, dueDate: obligation.dueDate, finalValue, paidValue, outstandingValue: Math.max(0, Number((finalValue - paidValue).toFixed(2))) }
                }).filter(obligation => obligation.outstandingValue > 0)
                const breakdown = Object.values(openObligations.reduce<Record<string, { type: string; totalOutstanding: number; count: number }>>((result, obligation) => {
                    const group = result[obligation.type] ?? { type: obligation.type, totalOutstanding: 0, count: 0 }
                    group.totalOutstanding += obligation.outstandingValue
                    group.count += 1
                    result[obligation.type] = group
                    return result
                }, {}))
                return {
                    id: engagement.id, status: engagement.status, modality: engagement.modality,
                    entryDate: engagement.entryDate, exitDate: engagement.exitDate,
                    currentSalary: engagement.currentSalary === null ? null : Number(engagement.currentSalary),
                    totalOutstanding: openObligations.reduce((sum, item) => sum + item.outstandingValue, 0),
                    openObligations: openObligations.length,
                    obligations: breakdown,
                    absencesThisMonth: engagement.movements.filter(item => item.type === 'falta').length,
                    tardinessThisMonth: engagement.movements.filter(item => item.type === 'atraso').length
                }
            })
        }))
        return {
            data,
            period: { month, year },
            pagination: { limit: query.limit, hasMore, nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null }
        }
    }
}

export default new EmployeeSummaryRepository()
