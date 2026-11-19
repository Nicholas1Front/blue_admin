import { Prisma } from '../../../generated/prisma/client.js'
import { prisma } from '../../../shared/database/prisma.js'
import { reconcileObligation } from '../obligations/helpers/reconcileObligation.js'
import {
    allocatePaymentFIFO,
    getOutstandingValue,
    PaymentAllocationError,
    validateManualAllocations,
    type AllocatableObligation
} from '../allocations/paymentAllocation.js'
import type {
    createMovementDTO,
    createPaymentDTO,
    findMovementsQueryDTO,
    updateMovementDTO,
    updatePaymentDTO
} from './movements.schema.js'

type PaymentData = createPaymentDTO | updatePaymentDTO

class MovementsRepository {
    private async lockEngagement(tx: Prisma.TransactionClient, engagementId: string) {
        await tx.$queryRaw`SELECT id FROM employee_engagements WHERE id = ${engagementId} FOR UPDATE`
        return tx.employeeEngagement.findUnique({
            where: { id: engagementId },
            select: { employeeId: true }
        })
    }

    private async findAllocatableObligations(tx: Prisma.TransactionClient, engagementId: string) {
        return tx.employeeObligation.findMany({
            where: {
                engagementId,
                status: { in: ['pendente', 'parcial'] }
            },
            select: {
                id: true,
                finalValue: true,
                referenceStart: true,
                dueDate: true,
                createdAt: true,
                allocations: { select: { value: true } }
            }
        })
    }

    private async createAllocations(
        tx: Prisma.TransactionClient,
        movementId: string,
        allocations: { obligationId: string; value: Prisma.Decimal; type: 'fifo' | 'manual' }[]
    ) {
        const affectedObligationIds = new Set<string>()

        for (const allocation of allocations) {
            await tx.employeePaymentAllocation.create({
                data: {
                    movementId,
                    obligationId: allocation.obligationId,
                    type: allocation.type,
                    value: allocation.value
                }
            })
            affectedObligationIds.add(allocation.obligationId)
        }

        for (const obligationId of affectedObligationIds) {
            await reconcileObligation(tx, obligationId, { forceStatus: true })
        }

        return [...affectedObligationIds]
    }

    private resolveAllocations(
        paymentValue: Prisma.Decimal,
        mode: PaymentData['allocationMode'],
        requestedAllocations: PaymentData['allocations'],
        obligations: AllocatableObligation[]
    ) {
        if (mode === 'oldest') {
            return allocatePaymentFIFO(paymentValue, obligations)
        }

        const result = validateManualAllocations(
            requestedAllocations ?? [],
            obligations
        )

        if (result.allocatedValue.gt(paymentValue)) {
            throw new PaymentAllocationError('PAYMENT_ALLOCATIONS_EXCEED_VALUE')
        }

        return {
            ...result,
            unallocatedValue: paymentValue.minus(result.allocatedValue)
        }
    }

    private async findMovementResult(tx: Prisma.TransactionClient, movementId: string) {
        const movement = await tx.employeeMovement.findUniqueOrThrow({
            where: { id: movementId },
            include: {
                allocations: {
                    include: {
                        obligation: {
                            select: {
                                id: true,
                                type: true,
                                title: true,
                                referenceStart: true,
                                referenceEnd: true,
                                finalValue: true,
                                status: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                },
                financialTransaction: {
                    select: {
                        id: true,
                        categoryId: true,
                        description: true,
                        value: true,
                        type: true,
                        referenceDate: true
                    }
                }
            }
        })

        const allocatedValue = movement.allocations.reduce(
            (total, allocation) => total.plus(allocation.value),
            new Prisma.Decimal(0)
        )
        const paymentValue = movement.value ?? new Prisma.Decimal(0)

        return {
            ...movement,
            value: movement.value === null ? null : Number(movement.value),
            allocatedValue: movement.type === 'pagamento' ? Number(allocatedValue) : null,
            unallocatedValue: movement.type === 'pagamento'
                ? Number(paymentValue.minus(allocatedValue))
                : null,
            allocations: movement.allocations.map(allocation => ({
                ...allocation,
                value: Number(allocation.value),
                obligation: {
                    ...allocation.obligation,
                    finalValue: Number(allocation.obligation.finalValue)
                }
            })),
            financialTransaction: movement.financialTransaction
                ? {
                    ...movement.financialTransaction,
                    value: Number(movement.financialTransaction.value)
                }
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
                    eventDate: new Date()
                }
            })

            return this.findMovementResult(tx, movement.id)
        })
    }

    async createPayment(engagementId: string, data: createPaymentDTO) {
        return prisma.$transaction(async tx => {
            const engagement = await this.lockEngagement(tx, engagementId)
            if (!engagement) return null

            const shouldCreateFinancialTransaction = data.createFinancialTransaction !== false
            const paymentDate = data.eventDate ?? (shouldCreateFinancialTransaction ? new Date() : null)
            const paymentValue = new Prisma.Decimal(data.value)
            const obligations = await this.findAllocatableObligations(tx, engagementId)
            const allocationResult = this.resolveAllocations(
                paymentValue,
                data.allocationMode,
                data.allocations,
                obligations
            )

            let transaction: { id: string } | null = null

            if (shouldCreateFinancialTransaction) {
                if (!data.categoryId) return { categoryNotFound: true as const }

                const category = await tx.financialCategory.findUnique({
                    where: { id: data.categoryId },
                    select: { id: true, type: true, active: true }
                })

                if (!category) return { categoryNotFound: true as const }
                if (!category.active) return { categoryInactive: true as const }
                if (category.type !== 'expense') return { invalidCategoryType: true as const }

                transaction = await tx.financialTransaction.create({
                    data: {
                        categoryId: category.id,
                        description: data.description,
                        value: paymentValue,
                        type: 'expense',
                        referenceDate: paymentDate ?? new Date(),
                        originId: null,
                        originType: null
                    },
                    select: { id: true }
                })
            }

            const movement = await tx.employeeMovement.create({
                data: {
                    engagementId,
                    type: 'pagamento',
                    description: data.description,
                    eventDate: paymentDate,
                    value: paymentValue,
                    financialTransactionId: transaction?.id ?? null,
                    observations: data.observations ?? null
                }
            })

            const affectedObligationIds = await this.createAllocations(
                tx,
                movement.id,
                allocationResult.allocations
            )

            await tx.employeeHistory.create({
                data: {
                    employeeId: engagement.employeeId,
                    engagementId,
                    eventType: 'pagamento_funcionario_registrado',
                    description: 'Pagamento do funcionário registrado e alocado.',
                    metadata: {
                        movementId: movement.id,
                        financialTransactionId: transaction?.id ?? null,
                        value: paymentValue.toString(),
                        allocationMode: data.allocationMode,
                        allocatedValue: allocationResult.allocatedValue.toString(),
                        unallocatedValue: allocationResult.unallocatedValue.toString(),
                        affectedObligationIds
                    },
                    eventDate: new Date()
                }
            })

            return {
                ...(await this.findMovementResult(tx, movement.id)),
                allocatedValue: Number(allocationResult.allocatedValue),
                unallocatedValue: Number(allocationResult.unallocatedValue)
            }
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
                include: {
                    allocations: { select: { obligationId: true, value: true, type: true } },
                    financialTransaction: { select: { id: true } }
                }
            })

            if (!existing) return null

            const shouldCreateFinancialTransaction = data.createFinancialTransaction ??
                Boolean(existing.financialTransaction)

            let category: { id: string; type: string; active: boolean } | null = null

            if (shouldCreateFinancialTransaction) {
                if (!data.categoryId) return { categoryNotFound: true as const }

                category = await tx.financialCategory.findUnique({
                    where: { id: data.categoryId },
                    select: { id: true, type: true, active: true }
                })

                if (!category) return { categoryNotFound: true as const }
                if (!category.active) return { categoryInactive: true as const }
                if (category.type !== 'expense') return { invalidCategoryType: true as const }
            }

            const previousObligationIds = [...new Set(existing.allocations.map(item => item.obligationId))]

            await tx.employeePaymentAllocation.deleteMany({
                where: { movementId }
            })

            for (const obligationId of previousObligationIds) {
                await reconcileObligation(tx, obligationId, { forceStatus: true })
            }

            const requestedDate = data.eventDate !== undefined ? data.eventDate : existing.eventDate
            const paymentDate = requestedDate ?? (shouldCreateFinancialTransaction ? new Date() : null)
            const paymentValue = new Prisma.Decimal(data.value)
            const obligations = await this.findAllocatableObligations(tx, engagementId)
            const allocationResult = this.resolveAllocations(
                paymentValue,
                data.allocationMode,
                data.allocations,
                obligations
            )

            let financialTransactionId = existing.financialTransaction?.id ?? null

            if (shouldCreateFinancialTransaction && category) {
                if (financialTransactionId) {
                    await tx.financialTransaction.update({
                        where: { id: financialTransactionId },
                        data: {
                            categoryId: category.id,
                            description: data.description,
                            value: paymentValue,
                            type: 'expense',
                            referenceDate: paymentDate ?? new Date()
                        }
                    })
                } else {
                    const transaction = await tx.financialTransaction.create({
                        data: {
                            categoryId: category.id,
                            description: data.description,
                            value: paymentValue,
                            type: 'expense',
                            referenceDate: paymentDate ?? new Date(),
                            originId: null,
                            originType: null
                        },
                        select: { id: true }
                    })
                    financialTransactionId = transaction.id
                }
            }

            await tx.employeeMovement.update({
                where: { id: movementId },
                data: {
                    description: data.description,
                    eventDate: paymentDate,
                    value: paymentValue,
                    financialTransactionId,
                    observations: data.observations !== undefined ? data.observations : existing.observations
                }
            })

            if (!shouldCreateFinancialTransaction && existing.financialTransaction) {
                await tx.financialTransaction.delete({
                    where: { id: existing.financialTransaction.id }
                })
                financialTransactionId = null
            }

            const affectedObligationIds = await this.createAllocations(
                tx,
                movementId,
                allocationResult.allocations
            )

            await tx.employeeHistory.create({
                data: {
                    employeeId: engagement.employeeId,
                    engagementId,
                    eventType: 'pagamento_funcionario_atualizado',
                    description: 'Pagamento do funcionário atualizado e realocado.',
                    metadata: {
                        movementId,
                        previousFinancialTransactionId: existing.financialTransaction?.id ?? null,
                        financialTransactionId,
                        previousValue: existing.value?.toString() ?? null,
                        value: paymentValue.toString(),
                        allocationMode: data.allocationMode,
                        allocatedValue: allocationResult.allocatedValue.toString(),
                        unallocatedValue: allocationResult.unallocatedValue.toString(),
                        previousAllocations: existing.allocations.map(allocation => ({
                            obligationId: allocation.obligationId,
                            value: allocation.value.toString(),
                            type: allocation.type
                        })),
                        previousObligationIds,
                        affectedObligationIds
                    },
                    eventDate: new Date()
                }
            })

            return {
                ...(await this.findMovementResult(tx, movementId)),
                allocatedValue: Number(allocationResult.allocatedValue),
                unallocatedValue: Number(allocationResult.unallocatedValue)
            }
        })
    }

    async deleteMovement(engagementId: string, movementId: string) {
        return prisma.$transaction(async tx => {
            const engagement = await this.lockEngagement(tx, engagementId)
            if (!engagement) return null

            const movement = await tx.employeeMovement.findFirst({
                where: { id: movementId, engagementId },
                include: {
                    allocations: {
                        select: {
                            id: true,
                            obligationId: true,
                            value: true,
                            type: true
                        }
                    },
                    financialTransaction: {
                        select: {
                            id: true,
                            description: true,
                            value: true,
                            categoryId: true,
                            referenceDate: true
                        }
                    }
                }
            })

            if (!movement) return null

            if (movement.type === 'pagamento') {
                const affectedObligationIds = [...new Set(movement.allocations.map(item => item.obligationId))]

                await tx.employeeHistory.create({
                    data: {
                        employeeId: engagement.employeeId,
                        engagementId,
                        eventType: 'pagamento_funcionario_excluido',
                        description: 'Pagamento do funcionário excluído. As alocações e eventual transação financeira vinculada foram removidas.',
                        metadata: {
                            movementId,
                            payment: {
                                value: movement.value?.toString() ?? null,
                                description: movement.description,
                                eventDate: movement.eventDate?.toISOString() ?? null,
                                financialTransactionId: movement.financialTransaction?.id ?? null,
                                financialDescription: movement.financialTransaction?.description ?? null,
                                financialValue: movement.financialTransaction?.value.toString() ?? null,
                                categoryId: movement.financialTransaction?.categoryId ?? null,
                                referenceDate: movement.financialTransaction?.referenceDate.toISOString() ?? null
                            },
                            allocations: movement.allocations.map(item => ({
                                obligationId: item.obligationId,
                                value: item.value.toString(),
                                type: item.type
                            })),
                            affectedObligationIds
                        },
                        eventDate: new Date()
                    }
                })

                await tx.employeePaymentAllocation.deleteMany({ where: { movementId } })
                await tx.employeeMovement.delete({ where: { id: movementId } })
                if (movement.financialTransaction) {
                    await tx.financialTransaction.delete({
                        where: { id: movement.financialTransaction.id }
                    })
                }

                for (const obligationId of affectedObligationIds) {
                    await reconcileObligation(tx, obligationId, { forceStatus: true })
                }

                return true
            }

            await tx.employeeHistory.create({
                data: {
                    employeeId: engagement.employeeId,
                    engagementId,
                    eventType: 'movimento_funcionario_excluido',
                    description: 'Movimentação do funcionário excluída.',
                    metadata: {
                        movementId,
                        type: movement.type,
                        description: movement.description,
                        eventDate: movement.eventDate?.toISOString() ?? null,
                        obligationId: movement.obligationId,
                        value: movement.value?.toString() ?? null
                    },
                    eventDate: new Date()
                }
            })

            await tx.employeeMovement.delete({ where: { id: movementId } })
            return true
        })
    }

    async findMovementsByEngagement(engagementId: string, filters: findMovementsQueryDTO) {
        const movements = await prisma.employeeMovement.findMany({
            where: {
                engagementId,
                ...(filters.type !== undefined ? { type: filters.type } : {}),
                ...(filters.startDate || filters.endDate ? {
                    eventDate: {
                        ...(filters.startDate ? { gte: filters.startDate } : {}),
                        ...(filters.endDate ? { lte: filters.endDate } : {})
                    }
                } : {})
            },
            orderBy: [
                { eventDate: 'desc' },
                { createdAt: 'desc' },
                { id: 'asc' }
            ],
            include: {
                allocations: {
                    include: {
                        obligation: {
                            select: {
                                id: true,
                                type: true,
                                title: true,
                                referenceStart: true,
                                referenceEnd: true,
                                finalValue: true,
                                status: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                },
                financialTransaction: {
                    select: {
                        id: true,
                        categoryId: true,
                        description: true,
                        value: true,
                        type: true,
                        referenceDate: true
                    }
                }
            }
        })

        return movements.map(movement => {
            const allocatedValue = movement.allocations.reduce(
                (total, allocation) => total.plus(allocation.value),
                new Prisma.Decimal(0)
            )
            const paymentValue = movement.value ?? new Prisma.Decimal(0)

            return {
                ...movement,
                value: movement.value === null ? null : Number(movement.value),
                allocatedValue: movement.type === 'pagamento' ? Number(allocatedValue) : null,
                unallocatedValue: movement.type === 'pagamento'
                    ? Number(paymentValue.minus(allocatedValue))
                    : null,
                allocations: movement.allocations.map(allocation => ({
                    ...allocation,
                    value: Number(allocation.value),
                    obligation: {
                        ...allocation.obligation,
                        finalValue: Number(allocation.obligation.finalValue)
                    }
                })),
                financialTransaction: movement.financialTransaction
                    ? {
                        ...movement.financialTransaction,
                        value: Number(movement.financialTransaction.value)
                    }
                    : null
            }
        })
    }

    async findOpenObligations(engagementId: string) {
        const obligations = await prisma.employeeObligation.findMany({
            where: {
                engagementId,
                status: { in: ['pendente', 'parcial'] }
            },
            include: {
                allocations: { select: { value: true } }
            },
            orderBy: [
                { referenceStart: 'asc' },
                { dueDate: 'asc' },
                { createdAt: 'asc' },
                { id: 'asc' }
            ]
        })

        return obligations.map(obligation => {
            const outstandingValue = getOutstandingValue(obligation)
            const allocatedValue = obligation.allocations.reduce(
                (total, allocation) => total.plus(allocation.value),
                new Prisma.Decimal(0)
            )

            return {
                id: obligation.id,
                type: obligation.type,
                title: obligation.title,
                referenceStart: obligation.referenceStart,
                referenceEnd: obligation.referenceEnd,
                dueDate: obligation.dueDate,
                status: obligation.status,
                finalValue: Number(obligation.finalValue),
                allocatedValue: Number(allocatedValue),
                outstandingValue: Number(outstandingValue)
            }
        }).filter(obligation => obligation.outstandingValue > 0).sort((first, second) => {
            const firstDate = first.referenceStart ?? first.dueDate
            const secondDate = second.referenceStart ?? second.dueDate

            if (firstDate === null && secondDate !== null) return 1
            if (firstDate !== null && secondDate === null) return -1
            if (firstDate && secondDate && firstDate.getTime() !== secondDate.getTime()) {
                return firstDate.getTime() - secondDate.getTime()
            }

            return first.id.localeCompare(second.id)
        })
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
