import { Prisma } from '../../../generated/prisma/client.js'
import { prisma } from '../../../shared/database/prisma.js'
import { AppError } from '../../../shared/errors/AppError.js'
import { registrarHistorico } from '../history/history.repository.js'
import type { CriarMovimentacaoDTO } from './movements.schema.js'

class MovementsRepository {
    create(data: CriarMovimentacaoDTO, createdById: string) {
        return prisma.$transaction(async tx => {
            const engagement = await tx.employeeEngagement.findUnique({
                where: { id: data.engagementId },
                select: { id: true, employeeId: true }
            })
            if (!engagement) throw new AppError('Engagement not found', 404, 'ENGAGEMENT_NOT_FOUND')

            let obligation = null
            if (data.obligationId) {
                obligation = await tx.employeeObligation.findFirst({
                    where: { id: data.obligationId, engagementId: data.engagementId }
                })
                if (!obligation) {
                    throw new AppError('The selected obligation does not belong to this engagement', 400, 'OBLIGATION_ENGAGEMENT_MISMATCH')
                }
            }

            if (data.type === 'desconto') {
                if (!obligation || obligation.finalValue === null || data.value === undefined || data.value === null) {
                    throw new AppError('A confirmed obligation and a discount value are required', 400, 'INVALID_DISCOUNT_TARGET')
                }
                if (obligation.status === 'em_revisao' || obligation.status === 'cancelado' || obligation.status === 'pago') {
                    throw new AppError('Only open confirmed obligations can receive a discount adjustment', 409, 'OBLIGATION_NOT_ADJUSTABLE')
                }

                const paidResult = await tx.employeePaymentAllocation.aggregate({
                    where: {
                        obligationId: obligation.id,
                        type: { in: ['pagamento', 'aplicacao_adiantamento'] },
                        movement: { is: { reversedAt: null } }
                    },
                    _sum: { value: true }
                })
                const paidValue = paidResult._sum.value ?? new Prisma.Decimal(0)
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
                    valorOriginalDaObrigacao: data.type === 'desconto' ? obligation?.finalValue?.toFixed(2) ?? null : null
                },
                eventDate: data.eventDate,
                createdById
            })

            return movement
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    }
}

export default new MovementsRepository()
