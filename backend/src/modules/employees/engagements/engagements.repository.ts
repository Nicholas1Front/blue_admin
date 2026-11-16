import { prisma } from '../../../shared/database/prisma.js'
import type { createEngagementDTO, updateEngagementDTO } from './engagements.schema.js'

class EngagementsRepository {
    async employeeExists(employeeId: string) {
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            select: { id: true }
        })
        return employee !== null
    }

    async createEngagement(employeeId: string, data: createEngagementDTO) {
        return prisma.$transaction(async tx => {
            const engagement = await tx.employeeEngagement.create({
                data: {
                    employeeId,
                    entryDate: data.entryDate ?? null,
                    exitDate: data.exitDate ?? null,
                    status: data.status,
                    currentSalary: data.currentSalary ?? null,
                    hourlyRate: data.hourlyRate ?? null,
                    modality: data.modality,
                    observations: data.observations ?? null
                }
            })

            const history = await tx.employeeHistory.create({
                data: {
                    employeeId,
                    engagementId: engagement.id,
                    eventType: 'vinculo_criado',
                    description: 'Vínculo/contrato criado.',
                    metadata: {
                        status: engagement.status,
                        modality: engagement.modality,
                        entryDate: engagement.entryDate?.toISOString() ?? null,
                        currentSalary: engagement.currentSalary?.toString() ?? null
                    },
                    eventDate: engagement.entryDate ?? new Date()
                }
            })

            return { engagement, history }
        })
    }

    async findEngagementById(employeeId: string, engagementId: string) {
        return prisma.employeeEngagement.findFirst({
            where: { id: engagementId, employeeId }
        })
    }

    async findEngagementsByEmployee(employeeId: string) {
        return prisma.employeeEngagement.findMany({
            where: { employeeId },
            orderBy: [
                { entryDate: 'desc' },
                { createdAt: 'desc' }
            ]
        })
    }

    async updateEngagement(
        employeeId: string,
        engagementId: string,
        data: updateEngagementDTO,
        changes: Record<string, { previous: string | number | null; current: string | number | null }>,
        eventDate: Date,
        salaryChanged: boolean
    ) {
        return prisma.$transaction(async tx => {
            const engagement = await tx.employeeEngagement.update({
                where: { id: engagementId },
                data: {
                    ...(data.entryDate !== undefined ? { entryDate: data.entryDate } : {}),
                    ...(data.exitDate !== undefined ? { exitDate: data.exitDate } : {}),
                    ...(data.status !== undefined ? { status: data.status } : {}),
                    ...(data.currentSalary !== undefined ? { currentSalary: data.currentSalary } : {}),
                    ...(data.hourlyRate !== undefined ? { hourlyRate: data.hourlyRate } : {}),
                    ...(data.modality !== undefined ? { modality: data.modality } : {}),
                    ...(data.observations !== undefined ? { observations: data.observations } : {})
                }
            })

            const history = await tx.employeeHistory.create({
                data: {
                    employeeId,
                    engagementId,
                    eventType: salaryChanged ? 'salario_vinculo_atualizado' : 'vinculo_atualizado',
                    description: salaryChanged
                        ? 'Dados do vínculo atualizados, incluindo alteração salarial.'
                        : 'Dados do vínculo/contrato atualizados.',
                    metadata: { changes },
                    eventDate
                }
            })

            return { engagement, history }
        })
    }
}

export default new EngagementsRepository()
