import { prisma } from '../../../shared/database/prisma.js'
import type { createEngagementDTO, updateEngagementDTO, findEngagementsByFiltersDTO } from './engagements.dto.js'

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

    async findEngagementsByEmployee(employeeId: string, filters: findEngagementsByFiltersDTO) {
        return prisma.employeeEngagement.findMany({
            where: {
                employeeId,
                ...(filters.status !== undefined && { status: filters.status }),
                ...(filters.modality !== undefined && { modality: filters.modality })
            },
            orderBy: [
                { entryDate: 'desc' },
                { createdAt: 'desc' }
            ]
        })
    }

    async updateEngagement(
        employeeId: string,
        engagementId: string,
        data: Omit<updateEngagementDTO, 'effectiveDate'>,
        changes: Record<string, { previous: string | number | null; current: string | number | null }>,
        eventDate: Date,
        salaryChanged: boolean
    ) {
        return prisma.$transaction(async tx => {
            const engagement = await tx.employeeEngagement.update({
                where: { id: engagementId },
                data
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
