import { prisma } from '../../../../shared/database/prisma.js'
import type { employeeHistoryQueryDTO } from '../queries.schema.js'

class EmployeeHistoryRepository {
    async findEmployeeHistory(employeeId: string, query: employeeHistoryQueryDTO) {
        const employee = await prisma.employee.findUnique({ where: { id: employeeId }, select: { id: true } })
        if (!employee) return null

        const where = { employeeId, ...(query.eventType ? { eventType: query.eventType } : {}) }
        if (query.cursor) {
            const cursor = await prisma.employeeHistory.findFirst({
                where: { ...where, id: query.cursor }, select: { id: true }
            })
            if (!cursor) return { invalidCursor: true as const }
        }

        const rows = await prisma.employeeHistory.findMany({
            where,
            ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
            take: query.limit + 1,
            orderBy: [{ eventDate: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }, { id: 'desc' }],
            select: {
                id: true, employeeId: true, engagementId: true, eventType: true,
                description: true, metadata: true, eventDate: true, createdAt: true
            }
        })
        const hasMore = rows.length > query.limit
        const data = hasMore ? rows.slice(0, query.limit) : rows
        return {
            data,
            pagination: { limit: query.limit, hasMore, nextCursor: hasMore ? data[data.length - 1]?.id ?? null : null }
        }
    }
}

export default new EmployeeHistoryRepository()
