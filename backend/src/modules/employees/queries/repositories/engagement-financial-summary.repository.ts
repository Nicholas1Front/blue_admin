import { prisma } from '../../../../shared/database/prisma.js'

class EngagementFinancialSummaryRepository {
    async findEngagementFinancialSummary(engagementId: string) {
        const now = new Date()
        const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
        const upcomingUntil = new Date(today)
        upcomingUntil.setUTCDate(upcomingUntil.getUTCDate() + 30)

        const engagement = await prisma.employeeEngagement.findUnique({
            where: { id: engagementId },
            select: {
                id: true,
                employeeId: true,
                employee: { select: { id: true, name: true } },
                obligations: {
                    where: { status: { in: ['pendente', 'parcial'] } },
                    select: {
                        id: true, type: true, title: true, referenceStart: true, referenceEnd: true,
                        dueDate: true, finalValue: true, status: true,
                        movements: { where: { type: 'pagamento' }, select: { value: true } }
                    }
                }
            }
        })
        if (!engagement) return null

        const obligations = engagement.obligations.map(obligation => {
            const paidValue = obligation.movements.reduce((sum, movement) => sum + Number(movement.value ?? 0), 0)
            const finalValue = Number(obligation.finalValue)
            return {
                id: obligation.id, type: obligation.type, title: obligation.title,
                referenceStart: obligation.referenceStart, referenceEnd: obligation.referenceEnd,
                dueDate: obligation.dueDate, status: obligation.status, finalValue, paidValue,
                outstandingValue: Math.max(0, Number((finalValue - paidValue).toFixed(2)))
            }
        }).filter(item => item.outstandingValue > 0)

        const grouped = Object.values(obligations.reduce<Record<string, { type: string; totalOutstanding: number; count: number }>>((result, obligation) => {
            const group = result[obligation.type] ?? { type: obligation.type, totalOutstanding: 0, count: 0 }
            group.totalOutstanding += obligation.outstandingValue
            group.count += 1
            result[obligation.type] = group
            return result
        }, {}))

        return {
            employee: engagement.employee,
            engagementId: engagement.id,
            totalOutstanding: obligations.reduce((sum, item) => sum + item.outstandingValue, 0),
            openObligationsCount: obligations.length,
            obligationsByType: grouped,
            overdueObligations: obligations.filter(item => item.dueDate && item.dueDate < today),
            upcomingObligations: obligations.filter(item => item.dueDate && item.dueDate >= today && item.dueDate < upcomingUntil)
                .sort((a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0))
        }
    }
}

export default new EngagementFinancialSummaryRepository()
