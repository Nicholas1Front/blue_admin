import { Prisma } from '../../../generated/prisma/client.js'
import { prisma } from '../../../shared/database/prisma.js'
import { AppError } from '../../../shared/errors/AppError.js'
import { registrarHistorico } from '../history/history.repository.js'
import type { AtualizarObrigacaoDTO, CriarObrigacaoDTO, RevisarObrigacaoDTO } from './obligations.schema.js'

class ObligationsRepository {
    findById(id: string) {
        return prisma.employeeObligation.findUnique({ where: { id } })
    }

    engagementExists(engagementId: string) {
        return prisma.employeeEngagement.findUnique({
            where: { id: engagementId },
            select: { id: true, employeeId: true }
        })
    }

    create(data: CriarObrigacaoDTO, createdById: string) {
        return prisma.$transaction(async tx => {
            const obligation = await tx.employeeObligation.create({
                data: {
                    engagementId: data.engagementId,
                    type: data.type,
                    title: data.title,
                    description: data.description ?? null,
                    originalValue: data.originalValue ?? null,
                    finalValue: null,
                    status: 'em_revisao',
                    referenceStart: data.referenceStart ?? null,
                    referenceEnd: data.referenceEnd ?? null,
                    dueDate: data.dueDate ?? null,
                    source: data.source,
                    referenceKey: data.referenceKey ?? null,
                    ...(data.calculationDetails !== undefined && {
                        calculationDetails: data.calculationDetails as Prisma.InputJsonObject
                    })
                }
            })

            const engagement = await tx.employeeEngagement.findUniqueOrThrow({
                where: { id: data.engagementId },
                select: { employeeId: true }
            })

            await registrarHistorico(tx, {
                employeeId: engagement.employeeId,
                engagementId: data.engagementId,
                type: 'obrigacao_criada',
                title: 'Obrigação registrada para revisão',
                description: `Obrigação criada: ${data.title}. Ainda não reconhecida como valor devido.`,
                metadata: { obligationId: obligation.id, tipo: data.type, origem: data.source },
                eventDate: data.referenceStart ?? new Date(),
                createdById
            })

            return obligation
        })
    }

    hasAllocations(id: string) {
        return prisma.employeePaymentAllocation.count({
            where: { obligationId: id }
        }).then(count => count > 0)
    }

    update(id: string, data: AtualizarObrigacaoDTO, createdById: string) {
        return prisma.$transaction(async tx => {
            const current = await tx.employeeObligation.findUnique({ where: { id } })
            if (!current) return null
            if (current.status === 'pago' || current.status === 'cancelado') {
                throw new AppError('Paid or canceled obligations cannot be edited', 409, 'OBLIGATION_NOT_EDITABLE')
            }
            if (data.originalValue !== undefined) {
                const allocationCount = await tx.employeePaymentAllocation.count({ where: { obligationId: id } })
                if (allocationCount > 0) {
                    throw new AppError('An obligation with payment allocations cannot have its original value changed', 409, 'OBLIGATION_HAS_ALLOCATIONS')
                }
            }

            const updated = await tx.employeeObligation.update({
                where: { id },
                data: {
                    ...(data.title !== undefined && { title: data.title }),
                    ...(data.description !== undefined && { description: data.description }),
                    ...(data.originalValue !== undefined && { originalValue: data.originalValue }),
                    ...(data.referenceStart !== undefined && { referenceStart: data.referenceStart }),
                    ...(data.referenceEnd !== undefined && { referenceEnd: data.referenceEnd }),
                    ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
                    ...(data.referenceKey !== undefined && { referenceKey: data.referenceKey })
                }
            })

            const engagement = await tx.employeeEngagement.findUniqueOrThrow({
                where: { id: current.engagementId },
                select: { employeeId: true }
            })

            await registrarHistorico(tx, {
                employeeId: engagement.employeeId,
                engagementId: current.engagementId,
                type: 'obrigacao_revisada',
                title: 'Dados da obrigação atualizados',
                description: `Campos atualizados: ${Object.keys(data).join(', ')}.`,
                metadata: { obligationId: id, campos: Object.keys(data) },
                eventDate: new Date(),
                createdById
            })

            return updated
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    }

    review(id: string, data: RevisarObrigacaoDTO, reviewedById: string) {
        return prisma.$transaction(async tx => {
            const current = await tx.employeeObligation.findUnique({ where: { id } })
            if (!current) return null
            if (current.status !== 'em_revisao') {
                throw new AppError('Only obligations under review can be confirmed', 409, 'OBLIGATION_NOT_UNDER_REVIEW')
            }

            const obligation = await tx.employeeObligation.update({
                where: { id },
                data: {
                    originalValue: current.originalValue ?? new Prisma.Decimal(data.finalValue),
                    finalValue: new Prisma.Decimal(data.finalValue),
                    dueDate: data.dueDate !== undefined ? data.dueDate : current.dueDate,
                    status: 'pendente',
                    reviewedAt: new Date(),
                    reviewedById
                }
            })

            const engagement = await tx.employeeEngagement.findUniqueOrThrow({
                where: { id: current.engagementId },
                select: { employeeId: true }
            })

            await registrarHistorico(tx, {
                employeeId: engagement.employeeId,
                engagementId: current.engagementId,
                type: 'obrigacao_revisada',
                title: 'Obrigação confirmada pelo responsável',
                description: `Valor reconhecido: R$ ${data.finalValue.toFixed(2)}.`,
                metadata: { obligationId: id, valorFinal: data.finalValue },
                eventDate: new Date(),
                createdById: reviewedById
            })

            return obligation
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    }

    cancel(id: string, reason: string, createdById: string) {
        return prisma.$transaction(async tx => {
            const current = await tx.employeeObligation.findUnique({ where: { id } })
            if (!current) return null
            if (current.status === 'pago' || current.status === 'cancelado') {
                throw new AppError('Paid or canceled obligations cannot be canceled again', 409, 'OBLIGATION_NOT_CANCELLABLE')
            }

            const allocationCount = await tx.employeePaymentAllocation.count({ where: { obligationId: id } })
            if (allocationCount > 0) {
                throw new AppError('An obligation with payment allocations cannot be canceled directly', 409, 'OBLIGATION_HAS_ALLOCATIONS')
            }

            const obligation = await tx.employeeObligation.update({
                where: { id },
                data: { status: 'cancelado', description: [current.description, `Cancelamento: ${reason}`].filter(Boolean).join('\n') }
            })

            const engagement = await tx.employeeEngagement.findUniqueOrThrow({
                where: { id: current.engagementId },
                select: { employeeId: true }
            })

            await registrarHistorico(tx, {
                employeeId: engagement.employeeId,
                engagementId: current.engagementId,
                type: 'obrigacao_cancelada',
                title: 'Obrigação cancelada',
                description: reason,
                metadata: { obligationId: id },
                eventDate: new Date(),
                createdById
            })

            return obligation
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    }
}

export default new ObligationsRepository()
