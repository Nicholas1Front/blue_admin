import { prisma } from '../../../../shared/database/prisma.js'
import { movementTypesRequiringObligation } from '../../shareds/allowedMovementTypes.js'

const financialMovementTypes = ['pagamento', ...movementTypesRequiringObligation]

const toCents = (value: number) => Math.round(value * 100)

class EmployeesConsistencyRepository {
    async analyzeEmployee(employeeId: string) {
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            select: {
                id: true,
                name: true,
                engagements: { select: { id: true } }
            }
        })
        if (!employee) return null

        const engagementIds = employee.engagements.map(item => item.id)
        if (engagementIds.length === 0) {
            return {
                employee: { id: employee.id, name: employee.name },
                summary: { missingObligation: 0, obligationBalance: 0, transactionAllocation: 0, invalidObligationLink: 0 },
                findings: { missingObligation: [], obligationBalance: [], transactionAllocation: [], invalidObligationLink: [] }
            }
        }

        const [obligations, paymentsByObligation, financialMovements] = await Promise.all([
            prisma.employeeObligation.findMany({
                where: { engagementId: { in: engagementIds } },
                select: {
                    id: true,
                    engagementId: true,
                    type: true,
                    title: true,
                    status: true,
                    dueDate: true,
                    referenceStart: true,
                    referenceEnd: true,
                    finalValue: true
                }
            }),
            prisma.employeeMovement.groupBy({
                by: ['obligationId'],
                where: {
                    engagementId: { in: engagementIds },
                    type: 'pagamento',
                    obligationId: { not: null }
                },
                _sum: { value: true }
            }),
            prisma.employeeMovement.findMany({
                where: {
                    engagementId: { in: engagementIds },
                    type: { in: financialMovementTypes }
                },
                select: {
                    id: true,
                    engagementId: true,
                    type: true,
                    description: true,
                    value: true,
                    obligationId: true,
                    financialTransactionId: true,
                    obligation: { select: { id: true, engagementId: true, type: true, title: true } }
                }
            })
        ])

        const paidByObligation = new Map(
            paymentsByObligation.map(item => [item.obligationId, Number(item._sum.value ?? 0)] as const)
        )
        const obligationBalanceFindings = obligations.flatMap(obligation => {
            const paidValue = paidByObligation.get(obligation.id) ?? 0
            const finalValue = Number(obligation.finalValue)
            const issues: { code: string; obligationId: string; engagementId: string; type: string; title: string; status: string; finalValue: number; paidValue: number; difference: number }[] = []
            const difference = Number((finalValue - paidValue).toFixed(2))

            if (toCents(paidValue) > toCents(finalValue)) {
                issues.push({
                    code: 'PAYMENTS_EXCEED_OBLIGATION',
                    obligationId: obligation.id,
                    engagementId: obligation.engagementId,
                    type: obligation.type,
                    title: obligation.title,
                    status: obligation.status,
                    finalValue,
                    paidValue,
                    difference: Number((paidValue - finalValue).toFixed(2))
                })
            }
            if (obligation.status === 'pago' && difference > 0) {
                issues.push({
                    code: 'PAID_STATUS_WITH_OPEN_BALANCE',
                    obligationId: obligation.id,
                    engagementId: obligation.engagementId,
                    type: obligation.type,
                    title: obligation.title,
                    status: obligation.status,
                    finalValue,
                    paidValue,
                    difference
                })
            }
            if (obligation.status === 'parcial' && paidValue <= 0) {
                issues.push({
                    code: 'PARTIAL_STATUS_WITHOUT_PAYMENT',
                    obligationId: obligation.id,
                    engagementId: obligation.engagementId,
                    type: obligation.type,
                    title: obligation.title,
                    status: obligation.status,
                    finalValue,
                    paidValue,
                    difference
                })
            }
            if (obligation.status === 'parcial' && toCents(paidValue) >= toCents(finalValue)) {
                issues.push({
                    code: 'PARTIAL_STATUS_WITHOUT_OPEN_BALANCE',
                    obligationId: obligation.id,
                    engagementId: obligation.engagementId,
                    type: obligation.type,
                    title: obligation.title,
                    status: obligation.status,
                    finalValue,
                    paidValue,
                    difference
                })
            }
            if (obligation.status === 'pendente' && paidValue > 0) {
                issues.push({
                    code: 'PENDING_STATUS_WITH_PAYMENT',
                    obligationId: obligation.id,
                    engagementId: obligation.engagementId,
                    type: obligation.type,
                    title: obligation.title,
                    status: obligation.status,
                    finalValue,
                    paidValue,
                    difference
                })
            }
            if (obligation.status === 'cancelado' && paidValue > 0) {
                issues.push({
                    code: 'CANCELLED_OBLIGATION_WITH_PAYMENT',
                    obligationId: obligation.id,
                    engagementId: obligation.engagementId,
                    type: obligation.type,
                    title: obligation.title,
                    status: obligation.status,
                    finalValue,
                    paidValue,
                    difference
                })
            }
            return issues
        })

        const missingObligationFindings = financialMovements
            .filter(movement => !movement.obligationId)
            .map(movement => ({
                code: 'FINANCIAL_MOVEMENT_WITHOUT_OBLIGATION',
                movementId: movement.id,
                engagementId: movement.engagementId,
                type: movement.type,
                description: movement.description,
                value: movement.value === null ? null : Number(movement.value)
            }))

        const invalidObligationLinkFindings = financialMovements
            .filter(movement => movement.obligation && movement.obligation.engagementId !== movement.engagementId)
            .map(movement => ({
                code: 'MOVEMENT_OBLIGATION_ENGAGEMENT_MISMATCH',
                movementId: movement.id,
                movementEngagementId: movement.engagementId,
                obligationId: movement.obligation?.id,
                obligationEngagementId: movement.obligation?.engagementId
            }))

        const transactionIds = [...new Set(financialMovements
            .map(movement => movement.financialTransactionId)
            .filter((id): id is string => id !== null))]
        const transactionAllocationFindings = transactionIds.length
            ? await prisma.employeeMovement.groupBy({
                by: ['financialTransactionId'],
                where: { financialTransactionId: { in: transactionIds } },
                _sum: { value: true }
            }).then(async allocations => {
                const transactions = await prisma.financialTransaction.findMany({
                    where: { id: { in: transactionIds } },
                    select: { id: true, description: true, value: true, referenceDate: true }
                })
                const transactionById = new Map(transactions.map(item => [item.id, item] as const))
                return allocations.flatMap(allocation => {
                    if (!allocation.financialTransactionId) return []
                    const transaction = transactionById.get(allocation.financialTransactionId)
                    if (!transaction) return []
                    const allocatedValue = Number(allocation._sum.value ?? 0)
                    const transactionValue = Number(transaction.value)
                    if (toCents(allocatedValue) <= toCents(transactionValue)) return []
                    return [{
                        code: 'MOVEMENTS_EXCEED_FINANCIAL_TRANSACTION',
                        financialTransactionId: transaction.id,
                        description: transaction.description,
                        referenceDate: transaction.referenceDate,
                        transactionValue,
                        allocatedValue,
                        difference: Number((allocatedValue - transactionValue).toFixed(2))
                    }]
                })
            })
            : []

        return {
            employee: { id: employee.id, name: employee.name },
            summary: {
                missingObligation: missingObligationFindings.length,
                obligationBalance: obligationBalanceFindings.length,
                transactionAllocation: transactionAllocationFindings.length,
                invalidObligationLink: invalidObligationLinkFindings.length
            },
            findings: {
                missingObligation: missingObligationFindings,
                obligationBalance: obligationBalanceFindings,
                transactionAllocation: transactionAllocationFindings,
                invalidObligationLink: invalidObligationLinkFindings
            }
        }
    }
}

export default new EmployeesConsistencyRepository()
