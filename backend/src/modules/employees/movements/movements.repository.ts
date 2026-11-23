import { Prisma } from '../../../generated/prisma/client.js'
import { prisma } from '../../../shared/database/prisma.js'
import type {
    createMovementDTO,
    createPaymentDTO,
    findMovementsQueryDTO,
    updateMovementDTO,
    updatePaymentDTO
} from './movements.schema.js'

class MovementsRepository {
    private async lockEngagement(tx: Prisma.TransactionClient, engagementId: string) {
        await tx.$queryRaw`SELECT id FROM employee_engagements WHERE id = ${engagementId} FOR UPDATE`
        return tx.employeeEngagement.findUnique({
            where: { id: engagementId },
            select: { employeeId: true }
        })
    }

    private async validateFinancialTransaction(
        tx: Prisma.TransactionClient,
        financialTransactionId: string,
        value: Prisma.Decimal,
        movementId?: string
    ) {
        await tx.$queryRaw`SELECT id FROM financial_transactions WHERE id = ${financialTransactionId} FOR UPDATE`
        const transaction = await tx.financialTransaction.findUnique({
            where: { id: financialTransactionId },
            select: { value: true, type: true, originId: true, originType: true }
        })
        if (!transaction) return 'notFound' as const
        if (transaction.type !== 'expense') return 'invalidType' as const
        if (transaction.originId !== null || transaction.originType !== null) return 'invalidOrigin' as const

        const aggregate = await tx.employeeMovement.aggregate({
            where: { financialTransactionId, ...(movementId ? { id: { not: movementId } } : {}) },
            _sum: { value: true }
        })
        const total = (aggregate._sum.value ?? new Prisma.Decimal(0)).plus(value)
        return total.lte(transaction.value) ? 'valid' as const : 'exceeded' as const
    }

    private async findMovementResult(tx: Prisma.TransactionClient, movementId: string) {
        const movement = await tx.employeeMovement.findUniqueOrThrow({
            where: { id: movementId },
            include: {
                obligation: {
                    select: { id: true, type: true, title: true, referenceStart: true, referenceEnd: true, finalValue: true, status: true }
                },
                financialTransaction: {
                    select: { id: true, categoryId: true, description: true, value: true, type: true, referenceDate: true }
                }
            }
        })
        return {
            ...movement,
            value: movement.value === null ? null : Number(movement.value),
            obligation: movement.obligation
                ? { ...movement.obligation, finalValue: Number(movement.obligation.finalValue) }
                : null,
            financialTransaction: movement.financialTransaction
                ? { ...movement.financialTransaction, value: Number(movement.financialTransaction.value) }
                : null
        }
    }

    async createMovement(engagementId: string, data: createMovementDTO) {
        return prisma.$transaction(async tx => {
            const engagement = await this.lockEngagement(tx, engagementId)
            if (!engagement) return null

            if (data.obligationId) {
                const obligation = await tx.employeeObligation.findFirst({
                    where: { id: data.obligationId, engagementId },
                    select: { id: true }
                })
                if (!obligation) return { invalidObligation: true as const }
            }

            const movement = await tx.employeeMovement.create({
                data: {
                    engagementId,
                    type: data.type,
                    description: data.description,
                    eventDate: data.eventDate ?? null,
                    referenceStart: data.referenceStart ?? null,
                    referenceEnd: data.referenceEnd ?? null,
                    value: data.value ?? null,
                    obligationId: data.obligationId ?? null,
                    observations: data.observations ?? null
                }
            })

            await tx.employeeHistory.create({
                data: {
                    employeeId: engagement.employeeId,
                    engagementId,
                    eventType: 'movimento_funcionario_registrado',
                    description: 'Movimentação do funcionário registrada.',
                    metadata: {
                        movementId: movement.id,
                        type: movement.type,
                        description: movement.description,
                        eventDate: movement.eventDate?.toISOString() ?? null,
                        obligationId: movement.obligationId
                    },
                    eventDate: movement.eventDate
                }
            })

            return this.findMovementResult(tx, movement.id)
        })
    }

    async createPayment(engagementId: string, data: createPaymentDTO) {
        return prisma.$transaction(async tx => {
            const engagement = await this.lockEngagement(tx, engagementId)
            if (!engagement) return null

            if (data.obligationId) {
                const obligation = await tx.employeeObligation.findFirst({
                    where: { id: data.obligationId, engagementId }, select: { id: true }
                })
                if (!obligation) return { invalidObligation: true as const }
            }

            let financialTransactionId = data.financialTransactionId ?? null
            const value = new Prisma.Decimal(data.value)
            const shouldCreateTransaction = !financialTransactionId && data.createFinancialTransaction !== false
            const eventDate = data.eventDate ?? (shouldCreateTransaction ? new Date() : null)

            if (financialTransactionId) {
                const validation = await this.validateFinancialTransaction(tx, financialTransactionId, value)
                if (validation === 'notFound') return { financialTransactionNotFound: true as const }
                if (validation === 'invalidType') return { invalidCategoryType: true as const }
                if (validation === 'invalidOrigin') return { transactionLinkedToOtherOrigin: true as const }
                if (validation === 'exceeded') return { financialTransactionExceeded: true as const }
            } else if (shouldCreateTransaction) {
                if (!data.categoryId) return { categoryNotFound: true as const }
                const category = await tx.financialCategory.findUnique({
                    where: { id: data.categoryId }, select: { id: true, type: true, active: true }
                })
                if (!category) return { categoryNotFound: true as const }
                if (!category.active) return { categoryInactive: true as const }
                if (category.type !== 'expense') return { invalidCategoryType: true as const }

                const transaction = await tx.financialTransaction.create({
                    data: {
                        categoryId: category.id, description: data.description, value,
                        type: 'expense', referenceDate: eventDate ?? new Date(),
                        originId: null, originType: null
                    },
                    select: { id: true }
                })
                financialTransactionId = transaction.id
            }

            const movement = await tx.employeeMovement.create({
                data: {
                    engagementId, type: 'pagamento', description: data.description,
                    eventDate, value, obligationId: data.obligationId ?? null,
                    financialTransactionId, observations: data.observations ?? null
                }
            })

            await tx.employeeHistory.create({
                data: {
                    employeeId: engagement.employeeId, engagementId,
                    eventType: 'pagamento_funcionario_registrado',
                    description: 'Pagamento do funcionário registrado.',
                    metadata: {
                        movementId: movement.id, financialTransactionId,
                        obligationId: movement.obligationId, value: value.toString()
                    },
                    eventDate
                }
            })
            return this.findMovementResult(tx, movement.id)
        })
    }

    async updateMovement(
        engagementId: string,
        movementId: string,
        data: updateMovementDTO
    ) {
        return prisma.$transaction(async tx => {
            const engagement = await this.lockEngagement(tx, engagementId)
            if (!engagement) return null

            const existing = await tx.employeeMovement.findFirst({
                where: { id: movementId, engagementId },
                select: {
                    id: true,
                    type: true,
                    description: true,
                    eventDate: true,
                    referenceStart: true,
                    referenceEnd: true,
                    value: true,
                    obligationId: true,
                    observations: true
                }
            })

            if (!existing) return null
            if (existing.type === 'pagamento') return { paymentRequiresPaymentFlow: true as const }

            const nextObligationId = data.obligationId !== undefined
                ? data.obligationId
                : existing.obligationId

            if (nextObligationId) {
                const obligation = await tx.employeeObligation.findFirst({
                    where: { id: nextObligationId, engagementId },
                    select: { id: true }
                })
                if (!obligation) return { invalidObligation: true as const }
            }

            const nextStart = data.referenceStart !== undefined
                ? data.referenceStart
                : existing.referenceStart
            const nextEnd = data.referenceEnd !== undefined
                ? data.referenceEnd
                : existing.referenceEnd

            if (nextStart && nextEnd && nextEnd < nextStart) {
                return { invalidPeriod: true as const }
            }

            await tx.employeeMovement.update({
                where: { id: movementId },
                data: {
                    ...(data.type !== undefined ? { type: data.type } : {}),
                    ...(data.description !== undefined ? { description: data.description } : {}),
                    ...(data.eventDate !== undefined ? { eventDate: data.eventDate } : {}),
                    ...(data.referenceStart !== undefined ? { referenceStart: data.referenceStart } : {}),
                    ...(data.referenceEnd !== undefined ? { referenceEnd: data.referenceEnd } : {}),
                    ...(data.value !== undefined ? { value: data.value } : {}),
                    ...(data.obligationId !== undefined ? { obligationId: data.obligationId } : {}),
                    ...(data.observations !== undefined ? { observations: data.observations } : {})
                }
            })

            await tx.employeeHistory.create({
                data: {
                    employeeId: engagement.employeeId,
                    engagementId,
                    eventType: 'movimento_funcionario_atualizado',
                    description: 'Movimentação do funcionário atualizada.',
                    metadata: {
                        movementId,
                        previous: {
                            type: existing.type,
                            description: existing.description,
                            eventDate: existing.eventDate?.toISOString() ?? null,
                            referenceStart: existing.referenceStart?.toISOString() ?? null,
                            referenceEnd: existing.referenceEnd?.toISOString() ?? null,
                            value: existing.value?.toString() ?? null,
                            obligationId: existing.obligationId,
                            observations: existing.observations
                        },
                        changes: {
                            ...(data.type !== undefined ? { type: data.type } : {}),
                            ...(data.description !== undefined ? { description: data.description } : {}),
                            ...(data.eventDate !== undefined ? { eventDate: data.eventDate?.toISOString() ?? null } : {}),
                            ...(data.referenceStart !== undefined ? { referenceStart: data.referenceStart?.toISOString() ?? null } : {}),
                            ...(data.referenceEnd !== undefined ? { referenceEnd: data.referenceEnd?.toISOString() ?? null } : {}),
                            ...(data.value !== undefined ? { value: data.value?.toString() ?? null } : {}),
                            ...(data.obligationId !== undefined ? { obligationId: data.obligationId } : {}),
                            ...(data.observations !== undefined ? { observations: data.observations } : {})
                        }
                    },
                    eventDate: new Date()
                }
            })

            return this.findMovementResult(tx, movementId)
        })
    }

    async updatePayment(engagementId: string, movementId: string, data: updatePaymentDTO) {
        return prisma.$transaction(async tx => {
            const engagement = await this.lockEngagement(tx, engagementId)
            if (!engagement) return null
            const existing = await tx.employeeMovement.findFirst({
                where: { id: movementId, engagementId, type: 'pagamento' },
                include: { financialTransaction: { select: { id: true, referenceDate: true } } }
            })
            if (!existing) return null
            if (existing.financialTransaction && data.categoryId !== undefined) {
                return { transactionManagedSeparately: true as const }
            }

            const obligationId = data.obligationId !== undefined ? data.obligationId : existing.obligationId
            if (obligationId) {
                const obligation = await tx.employeeObligation.findFirst({
                    where: { id: obligationId, engagementId }, select: { id: true }
                })
                if (!obligation) return { invalidObligation: true as const }
            }

            const value = new Prisma.Decimal(data.value)
            const shouldKeepTransaction = data.createFinancialTransaction ?? Boolean(existing.financialTransaction)
            let financialTransactionId = shouldKeepTransaction ? existing.financialTransaction?.id ?? null : null

            if (existing.financialTransaction && shouldKeepTransaction) {
                const validation = await this.validateFinancialTransaction(
                    tx, existing.financialTransaction.id, value, movementId
                )
                if (validation === 'notFound') return { financialTransactionNotFound: true as const }
                if (validation === 'invalidType') return { invalidCategoryType: true as const }
                if (validation === 'invalidOrigin') return { transactionLinkedToOtherOrigin: true as const }
                if (validation === 'exceeded') return { financialTransactionExceeded: true as const }
            } else if (!existing.financialTransaction && shouldKeepTransaction) {
                if (!data.categoryId) return { categoryNotFound: true as const }
                const category = await tx.financialCategory.findUnique({
                    where: { id: data.categoryId }, select: { id: true, type: true, active: true }
                })
                if (!category) return { categoryNotFound: true as const }
                if (!category.active) return { categoryInactive: true as const }
                if (category.type !== 'expense') return { invalidCategoryType: true as const }

                const transaction = await tx.financialTransaction.create({
                    data: {
                        categoryId: category.id, description: data.description, value,
                        type: 'expense',
                        referenceDate: data.eventDate ?? existing.eventDate ?? new Date(),
                        originId: null, originType: null
                    },
                    select: { id: true }
                })
                financialTransactionId = transaction.id
            }

            const eventDate = data.eventDate !== undefined
                ? data.eventDate
                : existing.eventDate ?? existing.financialTransaction?.referenceDate ?? null
            await tx.employeeMovement.update({
                where: { id: movementId },
                data: {
                    description: data.description, eventDate, value, obligationId,
                    financialTransactionId,
                    observations: data.observations !== undefined ? data.observations : existing.observations
                }
            })
            await tx.employeeHistory.create({
                data: {
                    employeeId: engagement.employeeId, engagementId,
                    eventType: 'pagamento_funcionario_atualizado',
                    description: 'Pagamento do funcionário atualizado.',
                    metadata: {
                        movementId, previousValue: existing.value?.toString() ?? null,
                        value: value.toString(), previousObligationId: existing.obligationId,
                        obligationId, previousFinancialTransactionId: existing.financialTransaction?.id ?? null,
                        financialTransactionId
                    },
                    eventDate
                }
            })
            return this.findMovementResult(tx, movementId)
        })
    }

    async deleteMovement(engagementId: string, movementId: string) {
        return prisma.$transaction(async tx => {
            const engagement = await this.lockEngagement(tx, engagementId)
            if (!engagement) return null
            const movement = await tx.employeeMovement.findFirst({
                where: { id: movementId, engagementId }
            })
            if (!movement) return null

            await tx.employeeHistory.create({
                data: {
                    employeeId: engagement.employeeId, engagementId,
                    eventType: movement.type === 'pagamento' ? 'pagamento_funcionario_excluido' : 'movimento_funcionario_excluido',
                    description: movement.type === 'pagamento'
                        ? 'Pagamento do funcionário excluído. A transação financeira vinculada foi preservada.'
                        : 'Movimentação do funcionário excluída.',
                    metadata: {
                        movementId, type: movement.type, description: movement.description,
                        eventDate: movement.eventDate?.toISOString() ?? null,
                        obligationId: movement.obligationId, value: movement.value?.toString() ?? null,
                        financialTransactionId: movement.financialTransactionId
                    },
                    eventDate: new Date()
                }
            })
            await tx.employeeMovement.delete({ where: { id: movementId } })
            return true
        })
    }

    async findMovementsByEngagement(engagementId: string, filters: findMovementsQueryDTO) {
        const startDate = filters.startDate ? new Date(filters.startDate) : undefined
        const endDate = filters.endDate ? new Date(filters.endDate) : undefined
        startDate?.setUTCHours(0, 0, 0, 0)
        endDate?.setUTCHours(23, 59, 59, 999)

        const movements = await prisma.employeeMovement.findMany({
            where: {
                engagementId,
                ...(filters.type !== undefined ? { type: filters.type } : {}),
                ...(startDate || endDate ? {
                    eventDate: {
                        ...(startDate ? { gte: startDate } : {}),
                        ...(endDate ? { lte: endDate } : {})
                    }
                } : {})
            },
            orderBy: [{ eventDate: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
            include: {
                obligation: {
                    select: { id: true, type: true, title: true, referenceStart: true, referenceEnd: true, finalValue: true, status: true }
                },
                financialTransaction: {
                    select: { id: true, categoryId: true, description: true, value: true, type: true, referenceDate: true }
                }
            }
        })

        return movements.map(movement => ({
            ...movement,
            value: movement.value === null ? null : Number(movement.value),
            obligation: movement.obligation
                ? { ...movement.obligation, finalValue: Number(movement.obligation.finalValue) }
                : null,
            financialTransaction: movement.financialTransaction
                ? { ...movement.financialTransaction, value: Number(movement.financialTransaction.value) }
                : null
        }))
    }

    async findOpenObligations(engagementId: string) {
        const obligations = await prisma.employeeObligation.findMany({
            where: { engagementId, status: { in: ['pendente', 'parcial'] } },
            include: {
                movements: { where: { type: 'pagamento' }, select: { value: true } }
            },
            orderBy: [{ referenceStart: 'asc' }, { dueDate: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }]
        })
        return obligations.map(obligation => {
            const paidValue = obligation.movements.reduce(
                (total, movement) => total.plus(movement.value ?? 0), new Prisma.Decimal(0)
            )
            const outstandingValue = obligation.finalValue.gt(paidValue)
                ? obligation.finalValue.minus(paidValue)
                : new Prisma.Decimal(0)
            return {
                id: obligation.id, type: obligation.type, title: obligation.title,
                referenceStart: obligation.referenceStart, referenceEnd: obligation.referenceEnd,
                dueDate: obligation.dueDate, status: obligation.status,
                finalValue: Number(obligation.finalValue), paidValue: Number(paidValue),
                outstandingValue: Number(outstandingValue)
            }
        }).filter(obligation => obligation.outstandingValue > 0)
    }

    async findMovementById(engagementId: string, movementId: string) {
        const movement = await prisma.employeeMovement.findFirst({
            where: { id: movementId, engagementId },
            select: { id: true }
        })
        if (!movement) return null

        return prisma.$transaction(tx => this.findMovementResult(tx, movement.id))
    }

    async findEngagementEmployeeId(engagementId: string) {
        return prisma.employeeEngagement.findUnique({
            where: { id: engagementId },
            select: { employeeId: true }
        })
    }
}

export default new MovementsRepository()
