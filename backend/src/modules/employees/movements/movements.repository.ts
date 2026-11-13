import { prisma } from '../../../shared/database/prisma.js'
import { registrarHistorico } from '../history/history.repository.js'
import type { CriarMovimentacaoDTO } from './movements.schema.js'

class MovementsRepository {
    engagementExists(engagementId: string) {
        return prisma.employeeEngagement.findUnique({
            where: { id: engagementId },
            select: { id: true, employeeId: true }
        })
    }

    obligationBelongsToEngagement(obligationId: string, engagementId: string) {
        return prisma.employeeObligation.findFirst({
            where: { id: obligationId, engagementId },
            select: { id: true }
        })
    }

    create(data: CriarMovimentacaoDTO, createdById: string) {
        return prisma.$transaction(async tx => {
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

            const engagement = await tx.employeeEngagement.findUniqueOrThrow({
                where: { id: data.engagementId },
                select: { employeeId: true }
            })

            await registrarHistorico(tx, {
                employeeId: engagement.employeeId,
                engagementId: data.engagementId,
                type: 'movimentacao_criada',
                title: 'Ocorrência registrada',
                description: `${data.title}. Registro sem aplicação automática de desconto.`,
                metadata: {
                    movementId: movement.id,
                    tipo: data.type,
                    valorInformado: data.value ?? null,
                    obligationId: data.obligationId ?? null
                },
                eventDate: data.eventDate,
                createdById
            })

            return movement
        })
    }
}

export default new MovementsRepository()
