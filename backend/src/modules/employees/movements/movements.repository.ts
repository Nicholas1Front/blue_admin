import { Prisma } from '../../../generated/prisma/client.js'
import { prisma } from '../../../shared/database/prisma.js'
import { AppError } from '../../../shared/errors/AppError.js'
import { registrarHistorico } from '../history/history.repository.js'
import type { CriarMovimentacaoDTO, EstornarMovimentacaoDTO } from './movements.schema.js'

const somarPagamentosDaObrigacao = async (tx: Prisma.TransactionClient, obligationId: string) => {
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

class MovementsRepository {
    create(data: CriarMovimentacaoDTO, createdById: string) {
        return prisma.$transaction(async tx => {
            const engagement = await tx.employeeEngagement.findUnique({
                where: { id: data.engagementId },
                select: { id: true, employeeId: true }
            })
            if (!engagement) throw new AppError('Engagement not found', 404, 'ENGAGEMENT_NOT_FOUND')

            const obligation = data.obligationId
                ? await tx.employeeObligation.findFirst({
                    where: { id: data.obligationId, engagementId: data.engagementId }
                })
                : null

            if (data.obligationId && !obligation) {
                throw new AppError('The selected obligation does not belong to this engagement', 400, 'OBLIGATION_ENGAGEMENT_MISMATCH')
            }

            if (data.type === 'desconto') {
                if (!obligation || obligation.finalValue === null || data.value === undefined || data.value === null) {
                    throw new AppError('A confirmed obligation and a discount value are required', 400, 'INVALID_DISCOUNT_TARGET')
                }
                if (obligation.status === 'em_revisao' || obligation.status === 'cancelado' || obligation.status === 'pago') {
                    throw new AppError('Only open confirmed obligations can receive a discount adjustment', 409, 'OBLIGATION_NOT_ADJUSTABLE')
                }

                const paidValue = await somarPagamentosDaObrigacao(tx, obligation.id)
                const discountValue = new Prisma.Decimal(data.value)
                const adjustedValue = obligation.finalValue.minus(discountValue)

                if (!adjustedValue.isPositive() || adjustedValue.lessThan(paidValue)) {
                    throw new AppError('Discount would reduce the obligation below the amount already paid', 409, 'DISCOUNT_EXCEEDS_REMAINING_BALANCE')
                }

                await tx.employeeObligation.update({
                    where: { id: obligation.id },
                    data: {
                        finalValue: adjustedValue,
                        status: paidValue.isZero() ? 'pendente' : paidValue.equals(adjustedValue) ? 'pago' : 'parcial'
                    }
                })
            }

            const movement = await tx.employeeMovement.create({
                data: {
                    engagementId: data.engagementId,
                    type: data.type,
                    title: data.title,
                    description: data.description ?? null,
                    value: data.value ?? null,
                    eventDate: data.eventDate,
                    obligationId: data.obligationId ?? null,
                    durationMinutes: data.durationMinutes ?? null,
                    absenceDays: data.absenceDays ?? null,
                    justificationStatus: data.justificationStatus ?? null,
                    createdById
                }
            })

            await registrarHistorico(tx, {
                employeeId: engagement.employeeId,
                engagementId: data.engagementId,
                type: data.type === 'desconto' ? 'correcao_registrada' : 'movimentacao_criada',
                title: data.type === 'desconto' ? 'Desconto revisado e aplicado à competência' : 'Ocorrência registrada',
                description: data.type === 'desconto'
                    ? `Desconto de R$ ${data.value?.toFixed(2)} aplicado à obrigação "${obligation?.title}". Motivo: ${data.description}.`
                    : `${data.title}. Registro sem aplicação automática de desconto.`,
                metadata: {
                    movementId: movement.id,
                    tipo: data.type,
                    valorInformado: data.value ?? null,
                    obligationId: data.obligationId ?? null,
                    valorAnteriorDaObrigacao: data.type === 'desconto' ? obligation?.finalValue?.toFixed(2) ?? null : null
                },
                eventDate: data.eventDate,
                createdById
            })

            return movement
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    }

    reverse(id: string, data: EstornarMovimentacaoDTO, createdById: string) {
        return prisma.$transaction(async tx => {
            const current = await tx.employeeMovement.findUnique({ where: { id } })
            if (!current) throw new AppError('Employee movement not found', 404, 'EMPLOYEE_MOVEMENT_NOT_FOUND')
            if (current.reversedAt) throw new AppError('Movement is already reversed', 409, 'MOVEMENT_ALREADY_REVERSED')
            if (current.type === 'pagamento') {
                throw new AppError('Payments require a dedicated financial reversal flow', 409, 'PAYMENT_REVERSAL_REQUIRES_FINANCIAL_FLOW')
            }

            const reversedAt = new Date()
            const movement = await tx.employeeMovement.update({
                where: { id },
                data: { reversedAt, reversalReason: data.reason }
            })

            if (current.type === 'desconto' && current.obligationId && current.value) {
                const obligation = await tx.employeeObligation.findUnique({
                    where: { id: current.obligationId }
                })
                if (!obligation || obligation.status === 'cancelado' || obligation.finalValue === null) {
                    throw new AppError('The adjusted obligation can no longer be restored automatically', 409, 'DISCOUNT_REVERSAL_NOT_AVAILABLE')
                }

                const restoredValue = obligation.finalValue.plus(current.value)
                const paidValue = await somarPagamentosDaObrigacao(tx, obligation.id)
                await tx.employeeObligation.update({
                    where: { id: obligation.id },
                    data: {
                        finalValue: restoredValue,
                        status: paidValue.isZero() ? 'pendente' : paidValue.equals(restoredValue) ? 'pago' : 'parcial'
                    }
                })
            }

            if (current.type === 'aplicacao_adiantamento' && current.obligationId) {
                const obligation = await tx.employeeObligation.findUnique({
                    where: { id: current.obligationId }
                })
                if (!obligation || obligation.finalValue === null || obligation.status === 'cancelado') {
                    throw new AppError('The destination obligation can no longer be recalculated', 409, 'ADVANCE_REVERSAL_NOT_AVAILABLE')
                }

                const paidValue = await somarPagamentosDaObrigacao(tx, obligation.id)
                await tx.employeeObligation.update({
                    where: { id: obligation.id },
                    data: {
                        status: paidValue.isZero() ? 'pendente' : paidValue.equals(obligation.finalValue) ? 'pago' : 'parcial'
                    }
                })
            }

            const engagement = await tx.employeeEngagement.findUniqueOrThrow({
                where: { id: current.engagementId },
                select: { employeeId: true }
            })
            await registrarHistorico(tx, {
                employeeId: engagement.employeeId,
                engagementId: current.engagementId,
                type: 'movimentacao_estornada',
                title: 'Movimentação estornada',
                description: data.reason,
                metadata: { movementId: id, tipo: current.type, valor: current.value?.toString() ?? null },
                eventDate: reversedAt,
                createdById
            })

            return movement
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    }
}

export default new MovementsRepository()
