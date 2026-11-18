import { Prisma } from '../../../generated/prisma/client.js'
import { prisma } from '../../../shared/database/prisma.js'
import type { createObligationDTO, updateObligationDTO } from './obligations.schema.js'

class ObligationsRepository {
    async findEngagementEmployeeId(engagementId: string) {
        return prisma.employeeEngagement.findUnique({
            where: { id: engagementId },
            select: { employeeId: true }
        })
    }

    async findObligationsByEngagement(engagementId: string) {
        const obligations = await prisma.employeeObligation.findMany({
            where: { engagementId },
            orderBy: [
                { referenceStart: 'desc' },
                { dueDate: 'asc' },
                { createdAt: 'desc' }
            ]
        })

        return obligations.map(obligation => ({
            ...obligation,
            originalValue: Number(obligation.originalValue),
            finalValue: Number(obligation.finalValue)
        }))
    }

    async findObligationById(engagementId: string, obligationId: string) {
        return prisma.employeeObligation.findFirst({
            where: { id: obligationId, engagementId },
            include: {
                allocations: { select: { id: true } },
                movements: { select: { id: true } }
            }
        })
    }

    async createObligation(
        engagementId: string,
        employeeId: string,
        data: createObligationDTO,
        preventDuplicate: boolean
    ) {
        return prisma.$transaction(async tx => {
            if (preventDuplicate && data.referenceStart && data.referenceEnd) {
                await tx.$queryRaw`SELECT id FROM employee_engagements WHERE id = ${engagementId} FOR UPDATE`

                const duplicate = await tx.employeeObligation.findFirst({
                    where: {
                        engagementId,
                        type: data.type,
                        referenceStart: data.referenceStart,
                        referenceEnd: data.referenceEnd
                    },
                    select: { id: true }
                })

                if (duplicate) return { duplicate: true as const, obligation: null }
            }

            const obligation = await tx.employeeObligation.create({
                data: {
                    engagementId,
                    type: data.type,
                    title: data.title,
                    description: data.description ?? null,
                    referenceStart: data.referenceStart ?? null,
                    referenceEnd: data.referenceEnd ?? null,
                    dueDate: data.dueDate ?? null,
                    originalValue: data.originalValue,
                    finalValue: data.finalValue,
                    status: data.status,
                    observations: data.observations ?? null
                }
            })

            await tx.employeeHistory.create({
                data: {
                    employeeId,
                    engagementId,
                    eventType: 'obrigacao_criada',
                    description: 'Obrigação do vínculo cadastrada.',
                    metadata: {
                        obligationId: obligation.id,
                        type: obligation.type,
                        title: obligation.title,
                        referenceStart: obligation.referenceStart?.toISOString() ?? null,
                        referenceEnd: obligation.referenceEnd?.toISOString() ?? null,
                        originalValue: obligation.originalValue.toString(),
                        finalValue: obligation.finalValue.toString()
                    },
                    eventDate: new Date()
                }
            })

            return {
                duplicate: false as const,
                obligation: {
                    ...obligation,
                    originalValue: Number(obligation.originalValue),
                    finalValue: Number(obligation.finalValue)
                }
            }
        })
    }

    async updateObligation(
        engagementId: string,
        employeeId: string,
        obligationId: string,
        data: updateObligationDTO,
        changes: Record<string, { previous: string | number | null; current: string | number | null }>,
        preventDuplicate: boolean,
        nextType: string,
        nextStart: Date | null,
        nextEnd: Date | null
    ) {
        return prisma.$transaction(async tx => {
            if (preventDuplicate && nextStart && nextEnd) {
                await tx.$queryRaw`SELECT id FROM employee_engagements WHERE id = ${engagementId} FOR UPDATE`

                const duplicate = await tx.employeeObligation.findFirst({
                    where: {
                        engagementId,
                        type: nextType,
                        referenceStart: nextStart,
                        referenceEnd: nextEnd,
                        id: { not: obligationId }
                    },
                    select: { id: true }
                })

                if (duplicate) return { duplicate: true as const, obligation: null }
            }

            const obligation = await tx.employeeObligation.update({
                where: { id: obligationId },
                data: {
                    ...(data.type !== undefined ? { type: data.type } : {}),
                    ...(data.title !== undefined ? { title: data.title } : {}),
                    ...(data.description !== undefined ? { description: data.description } : {}),
                    ...(data.referenceStart !== undefined ? { referenceStart: data.referenceStart } : {}),
                    ...(data.referenceEnd !== undefined ? { referenceEnd: data.referenceEnd } : {}),
                    ...(data.dueDate !== undefined ? { dueDate: data.dueDate } : {}),
                    ...(data.originalValue !== undefined ? { originalValue: data.originalValue } : {}),
                    ...(data.finalValue !== undefined ? { finalValue: data.finalValue } : {}),
                    ...(data.status !== undefined ? { status: data.status } : {}),
                    ...(data.observations !== undefined ? { observations: data.observations } : {})
                }
            })

            await tx.employeeHistory.create({
                data: {
                    employeeId,
                    engagementId,
                    eventType: 'obrigacao_atualizada',
                    description: 'Obrigação do vínculo atualizada.',
                    metadata: { obligationId, changes },
                    eventDate: new Date()
                }
            })

            return {
                duplicate: false as const,
                obligation: {
                    ...obligation,
                    originalValue: Number(obligation.originalValue),
                    finalValue: Number(obligation.finalValue)
                }
            }
        })
    }

    async deleteObligation(
        engagementId: string,
        employeeId: string,
        obligationId: string,
        snapshot: Prisma.InputJsonObject
    ) {
        return prisma.$transaction(async tx => {
            await tx.employeeHistory.create({
                data: {
                    employeeId,
                    engagementId,
                    eventType: 'obrigacao_excluida',
                    description: 'Obrigação do vínculo excluída.',
                    metadata: { obligationId, snapshot },
                    eventDate: new Date()
                }
            })

            return tx.employeeObligation.delete({
                where: { id: obligationId }
            })
        })
    }
    async findBenefitContext(engagementId: string) {
        return prisma.employeeEngagement.findUnique({
            where: { id: engagementId },
            select: {
                id: true,
                entryDate: true,
                exitDate: true,
                status: true,
                currentSalary: true,
                history: {
                    where: { eventType: 'salario_vinculo_atualizado' },
                    select: {
                        eventType: true,
                        eventDate: true,
                        metadata: true
                    },
                    orderBy: { eventDate: 'asc' }
                },
                obligations: {
                    where: { type: { in: ['ferias', 'decimo_terceiro'] } },
                    select: {
                        id: true,
                        type: true,
                        title: true,
                        referenceStart: true,
                        referenceEnd: true,
                        dueDate: true,
                        originalValue: true,
                        finalValue: true,
                        status: true,
                        allocations: { select: { value: true } },
                        movements: { select: { id: true } }
                    }
                }
            }
        })
    }

    async createObligationsBatch(
        engagementId: string,
        employeeId: string,
        data: createObligationDTO[],
        duplicateCandidates: { type: string; referenceStart: Date; referenceEnd: Date }[]
    ) {
        return prisma.$transaction(async tx => {
            if (duplicateCandidates.length > 0) {
                await tx.$queryRaw`SELECT id FROM employee_engagements WHERE id = ${engagementId} FOR UPDATE`

                const duplicates = await tx.employeeObligation.findMany({
                    where: {
                        engagementId,
                        OR: duplicateCandidates.map(candidate => ({
                            type: candidate.type,
                            referenceStart: candidate.referenceStart,
                            referenceEnd: candidate.referenceEnd
                        }))
                    },
                    select: {
                        type: true,
                        referenceStart: true,
                        referenceEnd: true
                    }
                })

                if (duplicates.length > 0) {
                    return { duplicate: true as const, obligations: [] }
                }
            }

            const obligations: Awaited<ReturnType<typeof tx.employeeObligation.create>>[] = []
            for (const item of data) {
                const obligation = await tx.employeeObligation.create({
                    data: {
                        engagementId,
                        type: item.type,
                        title: item.title,
                        description: item.description ?? null,
                        referenceStart: item.referenceStart ?? null,
                        referenceEnd: item.referenceEnd ?? null,
                        dueDate: item.dueDate ?? null,
                        originalValue: item.originalValue,
                        finalValue: item.finalValue,
                        status: item.status,
                        observations: item.observations ?? null
                    }
                })

                await tx.employeeHistory.create({
                    data: {
                        employeeId,
                        engagementId,
                        eventType: 'obrigacao_criada',
                        description: 'Obrigação do vínculo cadastrada em lote.',
                        metadata: {
                            obligationId: obligation.id,
                            type: obligation.type,
                            title: obligation.title,
                            referenceStart: obligation.referenceStart?.toISOString() ?? null,
                            referenceEnd: obligation.referenceEnd?.toISOString() ?? null,
                            originalValue: obligation.originalValue.toString(),
                            finalValue: obligation.finalValue.toString()
                        },
                        eventDate: new Date()
                    }
                })

                obligations.push(obligation)
            }

            return {
                duplicate: false as const,
                obligations: obligations.map(obligation => ({
                    ...obligation,
                    originalValue: Number(obligation.originalValue),
                    finalValue: Number(obligation.finalValue)
                }))
            }
        })
    }

}

export default new ObligationsRepository()
