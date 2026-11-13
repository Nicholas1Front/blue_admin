import { Prisma } from '../../../generated/prisma/client.js'
import { prisma } from '../../../shared/database/prisma.js'
import { AppError } from '../../../shared/errors/AppError.js'
import { registrarHistorico } from '../history/history.repository.js'
import type { AplicarAdiantamentoDTO, RegistrarPagamentoDTO } from './allocations.schema.js'

const somarAlocacoesDaObrigacao = async (
    tx: Prisma.TransactionClient,
    obligationId: string
) => {
    const result = await tx.employeePaymentAllocation.aggregate({
        where: {
            obligationId,
            type: { in: ['pagamento', 'aplicacao_adiantamento'] },
            movement: { is: { reversedAt: null } }
        },
        _sum: { value: true }
    })
    return result._sum.value ?? new Prisma.Decimal(0)
}

const atualizarStatusObrigacao = async (
    tx: Prisma.TransactionClient,
    obligationId: string,
    valorAlocado: Prisma.Decimal
) => {
    const obligation = await tx.employeeObligation.findUnique({ where: { id: obligationId } })
    if (!obligation || obligation.finalValue === null) {
        throw new AppError('Confirmed obligation value not found', 409, 'OBLIGATION_VALUE_NOT_CONFIRMED')
    }

    const saldo = obligation.finalValue.minus(valorAlocado)
    if (saldo.isNegative()) {
        throw new AppError('Allocations exceed the obligation balance', 409, 'OBLIGATION_BALANCE_EXCEEDED')
    }

    const status = saldo.isZero() ? 'pago' : valorAlocado.isZero() ? 'pendente' : 'parcial'
    return tx.employeeObligation.update({ where: { id: obligationId }, data: { status } })
}

class AllocationsRepository {
    async registerPayment(data: RegistrarPagamentoDTO, createdById: string) {
        return prisma.$transaction(async tx => {
            const engagement = await tx.employeeEngagement.findUnique({
                where: { id: data.engagementId },
                select: { id: true, employeeId: true }
            })
            if (!engagement) throw new AppError('Engagement not found', 404, 'ENGAGEMENT_NOT_FOUND')

            const paymentValue = new Prisma.Decimal(data.value)
            const movement = await tx.employeeMovement.create({
                data: {
                    engagementId: data.engagementId,
                    type: 'pagamento',
                    title: data.title,
                    description: data.description ?? null,
                    value: paymentValue,
                    eventDate: data.eventDate,
                    createdById
                }
            })

            let transaction: Awaited<ReturnType<typeof tx.financialTransaction.findUnique>> = null
            if (data.categoryId) {
                const category = await tx.financialCategory.findUnique({ where: { id: data.categoryId } })
                if (!category) throw new AppError('Financial category not found', 404, 'CATEGORY_NOT_FOUND')
                if (!category.active || category.type !== 'expense') {
                    throw new AppError('An active expense category is required for employee payments', 400, 'INVALID_EMPLOYEE_PAYMENT_CATEGORY')
                }

                transaction = await tx.financialTransaction.create({
                    data: {
                        categoryId: category.id,
                        description: data.description?.trim() || data.title,
                        value: paymentValue,
                        type: 'expense',
                        referenceDate: data.eventDate,
                        originType: 'employee_movement',
                        originId: movement.id
                    }
                })

                await tx.employeeMovement.update({
                    where: { id: movement.id },
                    data: { transactionId: transaction.id }
                })
            } else if (data.transactionId) {
                const existingTransaction = await tx.financialTransaction.findUnique({
                    where: { id: data.transactionId },
                    include: { titheForService: { select: { id: true } } }
                })
                if (!existingTransaction) throw new AppError('Financial transaction not found', 404, 'TRANSACTION_NOT_FOUND')
                if (existingTransaction.titheForService !== null) {
                    throw new AppError('A service tithe transaction cannot be linked to an employee payment', 409, 'TRANSACTION_ALREADY_LINKED')
                }
                if (existingTransaction.type !== 'expense' || !existingTransaction.value.equals(paymentValue)) {
                    throw new AppError('The linked transaction must be an expense with the same value', 400, 'INVALID_EMPLOYEE_PAYMENT_TRANSACTION')
                }
                if (existingTransaction.originId !== null || existingTransaction.originType !== null) {
                    throw new AppError('Financial transaction is already linked to another origin', 409, 'TRANSACTION_ALREADY_LINKED')
                }

                transaction = await tx.financialTransaction.update({
                    where: { id: existingTransaction.id },
                    data: { originType: 'employee_movement', originId: movement.id }
                })
                await tx.employeeMovement.update({
                    where: { id: movement.id },
                    data: { transactionId: transaction.id }
                })
            }

            for (const allocation of data.allocations) {
                const obligation = await tx.employeeObligation.findFirst({
                    where: {
                        id: allocation.obligationId,
                        engagementId: data.engagementId
                    }
                })
                if (!obligation) {
                    throw new AppError('An obligation does not belong to this engagement', 400, 'OBLIGATION_ENGAGEMENT_MISMATCH')
                }
                if (obligation.status === 'em_revisao' || obligation.status === 'cancelado' || obligation.finalValue === null) {
                    throw new AppError('Only confirmed and open obligations can receive payments', 409, 'OBLIGATION_NOT_PAYABLE')
                }

                const previous = await somarAlocacoesDaObrigacao(tx, obligation.id)
                const allocationValue = new Prisma.Decimal(allocation.value)
                const nextTotal = previous.plus(allocationValue)
                if (nextTotal.greaterThan(obligation.finalValue)) {
                    throw new AppError('Allocation exceeds the remaining obligation balance', 409, 'OBLIGATION_BALANCE_EXCEEDED')
                }

                await tx.employeePaymentAllocation.create({
                    data: {
                        movementId: movement.id,
                        obligationId: obligation.id,
                        type: 'pagamento',
                        value: allocationValue
                    }
                })
                await atualizarStatusObrigacao(tx, obligation.id, nextTotal)
            }

            let advanceMovement: Awaited<ReturnType<typeof tx.employeeMovement.findUnique>> = null
            if (data.advanceCreditValue > 0) {
                const creditValue = new Prisma.Decimal(data.advanceCreditValue)
                await tx.employeePaymentAllocation.create({
                    data: {
                        movementId: movement.id,
                        obligationId: null,
                        type: 'credito_adiantamento',
                        value: creditValue
                    }
                })

                advanceMovement = await tx.employeeMovement.create({
                    data: {
                        engagementId: data.engagementId,
                        type: 'adiantamento',
                        title: 'Crédito de adiantamento reservado',
                        description: `Crédito originado do pagamento ${movement.id}.`,
                        value: creditValue,
                        eventDate: data.eventDate,
                        sourceMovementId: movement.id,
                        createdById
                    }
                })
            }

            await registrarHistorico(tx, {
                employeeId: engagement.employeeId,
                engagementId: engagement.id,
                type: 'pagamento_registrado',
                title: 'Pagamento registrado',
                description: `Pagamento de R$ ${paymentValue.toFixed(2)} registrado e integralmente distribuído.`,
                metadata: {
                    movementId: movement.id,
                    transactionId: transaction?.id ?? null,
                    allocations: data.allocations,
                    advanceCreditValue: data.advanceCreditValue
                },
                eventDate: data.eventDate,
                createdById
            })

            if (data.advanceCreditValue > 0) {
                await registrarHistorico(tx, {
                    employeeId: engagement.employeeId,
                    engagementId: engagement.id,
                    type: 'adiantamento_reservado',
                    title: 'Crédito de adiantamento reservado',
                    description: `Crédito de R$ ${data.advanceCreditValue.toFixed(2)} disponível para uma competência futura.`,
                    metadata: {
                        sourcePaymentMovementId: movement.id,
                        advanceMovementId: advanceMovement?.id ?? null,
                        value: data.advanceCreditValue
                    },
                    eventDate: data.eventDate,
                    createdById
                })
            }

            const updatedMovement = await tx.employeeMovement.findUniqueOrThrow({
                where: { id: movement.id },
                include: { allocations: true }
            })

            return { movement: updatedMovement, transaction, advanceMovement }
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    }

    async applyAdvance(data: AplicarAdiantamentoDTO, createdById: string) {
        return prisma.$transaction(async tx => {
            const advance = await tx.employeeMovement.findUnique({
                where: { id: data.sourceMovementId },
                select: {
                    id: true,
                    engagementId: true,
                    type: true,
                    sourceMovementId: true,
                    value: true,
                    reversedAt: true
                }
            })
            if (
                !advance ||
                advance.type !== 'adiantamento' ||
                !advance.sourceMovementId ||
                advance.reversedAt !== null
            ) {
                throw new AppError('A valid, unreversed advance movement was not found', 404, 'ADVANCE_SOURCE_NOT_FOUND')
            }

            const paymentSource = await tx.employeeMovement.findUnique({
                where: { id: advance.sourceMovementId },
                select: { id: true, type: true, reversedAt: true }
            })
            if (!paymentSource || paymentSource.type !== 'pagamento' || paymentSource.reversedAt !== null) {
                throw new AppError('The original payment for this advance is unavailable', 409, 'ADVANCE_PAYMENT_SOURCE_INVALID')
            }

            const creditResult = await tx.employeePaymentAllocation.aggregate({
                where: {
                    movementId: paymentSource.id,
                    type: 'credito_adiantamento',
                    obligationId: null
                },
                _sum: { value: true }
            })
            const creditTotal = creditResult._sum.value ?? new Prisma.Decimal(0)
            if (advance.value === null || !advance.value.equals(creditTotal)) {
                throw new AppError('Advance movement and reserved credit values do not match', 409, 'ADVANCE_CREDIT_INCONSISTENT')
            }

            const appliedResult = await tx.employeePaymentAllocation.aggregate({
                where: {
                    type: 'aplicacao_adiantamento',
                    movement: {
                        is: {
                            sourceMovementId: advance.id,
                            reversedAt: null
                        }
                    }
                },
                _sum: { value: true }
            })
            const alreadyApplied = appliedResult._sum.value ?? new Prisma.Decimal(0)
            const availableCredit = creditTotal.minus(alreadyApplied)
            const applicationValue = new Prisma.Decimal(data.value)

            if (availableCredit.lessThan(applicationValue)) {
                throw new AppError('Application exceeds the available advance credit', 409, 'ADVANCE_BALANCE_EXCEEDED')
            }

            const obligation = await tx.employeeObligation.findFirst({
                where: {
                    id: data.obligationId,
                    engagementId: advance.engagementId
                }
            })
            if (!obligation) {
                throw new AppError('The destination obligation does not belong to this engagement', 400, 'OBLIGATION_ENGAGEMENT_MISMATCH')
            }
            if (obligation.finalValue === null || obligation.status === 'em_revisao' || obligation.status === 'cancelado') {
                throw new AppError('Only confirmed and open obligations can receive advance credit', 409, 'OBLIGATION_NOT_PAYABLE')
            }

            const previousAllocated = await somarAlocacoesDaObrigacao(tx, obligation.id)
            const nextTotal = previousAllocated.plus(applicationValue)
            if (nextTotal.greaterThan(obligation.finalValue)) {
                throw new AppError('Advance application exceeds the remaining obligation balance', 409, 'OBLIGATION_BALANCE_EXCEEDED')
            }

            const movement = await tx.employeeMovement.create({
                data: {
                    engagementId: advance.engagementId,
                    type: 'aplicacao_adiantamento',
                    title: data.title,
                    description: data.description ?? null,
                    value: applicationValue,
                    eventDate: data.eventDate,
                    sourceMovementId: advance.id,
                    obligationId: obligation.id,
                    createdById
                }
            })

            const allocation = await tx.employeePaymentAllocation.create({
                data: {
                    movementId: movement.id,
                    obligationId: obligation.id,
                    type: 'aplicacao_adiantamento',
                    value: applicationValue
                }
            })

            await atualizarStatusObrigacao(tx, obligation.id, nextTotal)

            const engagement = await tx.employeeEngagement.findUniqueOrThrow({
                where: { id: advance.engagementId },
                select: { employeeId: true }
            })
            await registrarHistorico(tx, {
                employeeId: engagement.employeeId,
                engagementId: advance.engagementId,
                type: 'adiantamento_aplicado',
                title: 'Adiantamento aplicado à competência',
                description: `R$ ${applicationValue.toFixed(2)} aplicados em "${obligation.title}". Nenhuma nova saída financeira foi criada.`,
                metadata: {
                    sourceAdvanceMovementId: advance.id,
                    sourcePaymentMovementId: paymentSource.id,
                    applicationMovementId: movement.id,
                    obligationId: obligation.id,
                    value: applicationValue.toFixed(2)
                },
                eventDate: data.eventDate,
                createdById
            })

            return { movement, allocation, availableCreditAfter: availableCredit.minus(applicationValue) }
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    }
}

export default new AllocationsRepository()
