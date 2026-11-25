import { prisma } from '../../../shared/database/prisma.js'
import type { createEngagementDTO, findEngagementsByFiltersDTO, updateEngagementDTO } from './engagements.schema.js'

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
                        exitDate: engagement.exitDate?.toISOString() ?? null,
                        currentSalary: engagement.currentSalary?.toString() ?? null,
                        hourlyRate: engagement.hourlyRate?.toString() ?? null,
                        observations: engagement.observations
                    },
                    eventDate: engagement.entryDate ?? new Date()
                }
            })

            return { engagement, history }
        })
    }

    async findEngagementsByFilters(filters: findEngagementsByFiltersDTO) {
        const toDateRange = (from?: Date, to?: Date) => {
            const range: { gte?: Date; lt?: Date } = {}
            if (from) range.gte = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()))
            if (to) range.lt = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate() + 1))
            return range
        }

        const where = {
            ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
            ...(filters.status ? { status: filters.status } : {}),
            ...(filters.modality ? { modality: filters.modality } : {}),
            ...(filters.employeeName ? {
                employee: { is: { name: { contains: filters.employeeName, mode: 'insensitive' as const } } }
            } : {}),
            ...(filters.entryDateFrom || filters.entryDateTo
                ? { entryDate: toDateRange(filters.entryDateFrom, filters.entryDateTo) }
                : {}),
            ...(filters.exitDateFrom || filters.exitDateTo
                ? { exitDate: toDateRange(filters.exitDateFrom, filters.exitDateTo) }
                : {})
        }

        if (filters.cursor) {
            const cursorExists = await prisma.employeeEngagement.findFirst({
                where: { ...where, id: filters.cursor },
                select: { id: true }
            })
            if (!cursorExists) return { invalidCursor: true as const }
        }

        const rows = await prisma.employeeEngagement.findMany({
            where,
            ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
            take: filters.limit + 1,
            orderBy: [
                { entryDate: { sort: 'desc', nulls: 'last' } },
                { createdAt: 'desc' },
                { id: 'desc' }
            ],
            include: {
                employee: { select: { id: true, name: true, document: true } }
            }
        })

        const hasMore = rows.length > filters.limit
        const data = hasMore ? rows.slice(0, filters.limit) : rows
        return {
            data,
            pagination: {
                limit: filters.limit,
                hasMore,
                nextCursor: hasMore ? data[data.length - 1]?.id ?? null : null
            }
        }
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
