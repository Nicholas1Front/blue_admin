import { prisma } from '../../shared/database/prisma.js'
import type { createEmployeeDTO, findEmployeesByFiltersDTO, updateEmployeeDTO } from './employees.schema.js'

class EmployeesRepository {
    async createEmployee(data: createEmployeeDTO) {
        return prisma.$transaction(async tx => {
            const employee = await tx.employee.create({
                data: {
                    name: data.name,
                    document: data.document ?? null,
                    address: data.address ?? null,
                    birthDate: data.birthDate ?? null,
                    observations: data.observations ?? null
                }
            })

            const history = await tx.employeeHistory.create({
                data: {
                    employeeId: employee.id,
                    eventType: 'funcionario_cadastrado',
                    description: 'Funcionário cadastrado.',
                    metadata: {
                        name: employee.name,
                        document: employee.document,
                        address: employee.address,
                        birthDate: employee.birthDate?.toISOString() ?? null
                    },
                    eventDate: new Date()
                }
            })

            return { employee, history }
        })
    }

    async findEmployeesByFilters(filters: findEmployeesByFiltersDTO) {
        const where = {
            ...(filters.name ? { name: { contains: filters.name, mode: 'insensitive' as const } } : {}),
            ...(filters.document ? { document: { contains: filters.document, mode: 'insensitive' as const } } : {}),
            ...(filters.address ? { address: { contains: filters.address, mode: 'insensitive' as const } } : {}),
            ...(filters.birthDateFrom || filters.birthDateTo ? {
                birthDate: {
                    ...(filters.birthDateFrom ? { gte: new Date(Date.UTC(filters.birthDateFrom.getUTCFullYear(), filters.birthDateFrom.getUTCMonth(), filters.birthDateFrom.getUTCDate())) } : {}),
                    ...(filters.birthDateTo ? { lt: new Date(Date.UTC(filters.birthDateTo.getUTCFullYear(), filters.birthDateTo.getUTCMonth(), filters.birthDateTo.getUTCDate() + 1)) } : {})
                }
            } : {})
        }

        if (filters.cursor) {
            const cursorExists = await prisma.employee.findFirst({
                where: { ...where, id: filters.cursor },
                select: { id: true }
            })
            if (!cursorExists) return { invalidCursor: true as const }
        }

        const rows = await prisma.employee.findMany({
            where,
            ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
            take: filters.limit + 1,
            orderBy: [{ name: 'asc' }, { id: 'asc' }],
            select: {
                id: true,
                name: true,
                document: true,
                address: true,
                birthDate: true,
                observations: true,
                createdAt: true,
                updatedAt: true,
                _count: { select: { engagements: true } }
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

    async findEmployeeById(id: string) {
        return prisma.employee.findUnique({
            where: { id }
        })
    }

    async updateEmployee(id: string, data: updateEmployeeDTO, changes: Record<string, { previous: string | null; current: string | null }>) {
        return prisma.$transaction(async tx => {
            const employee = await tx.employee.update({
                where: { id },
                data: {
                    ...(data.name !== undefined ? { name: data.name } : {}),
                    ...(data.document !== undefined ? { document: data.document } : {}),
                    ...(data.address !== undefined ? { address: data.address } : {}),
                    ...(data.birthDate !== undefined ? { birthDate: data.birthDate } : {}),
                    ...(data.observations !== undefined ? { observations: data.observations } : {})
                }
            })

            const history = await tx.employeeHistory.create({
                data: {
                    employeeId: id,
                    eventType: 'funcionario_atualizado',
                    description: 'Dados cadastrais do funcionário atualizados.',
                    metadata: { changes },
                    eventDate: new Date()
                }
            })

            return { employee, history }
        })
    }
    async deleteEmployeeWithEngagements(id: string, expectedName: string) {
        return prisma.$transaction(async tx => {
            await tx.$queryRaw`SELECT id FROM employees WHERE id = ${id} FOR UPDATE`

            const employee = await tx.employee.findUnique({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    engagements: {
                        select: {
                            id: true,
                            obligations: { select: { id: true } },
                            movements: { select: { id: true, financialTransactionId: true } }
                        }
                    }
                }
            })

            if (!employee) return null
            if (employee.name !== expectedName) return { confirmationMismatch: true as const }

            const engagementIds = employee.engagements.map(item => item.id)
            const obligationCount = employee.engagements.reduce((total, item) => total + item.obligations.length, 0)
            const movements = employee.engagements.flatMap(item => item.movements)
            const financialTransactionIds = [...new Set(
                movements
                    .map(item => item.financialTransactionId)
                    .filter((id): id is string => id !== null)
            )]

            // Remove dependent employee records in FK-safe order. Financial transactions
            // belong to the Finance module and are intentionally preserved.
            await tx.employeeHistory.deleteMany({ where: { employeeId: id } })
            if (engagementIds.length > 0) {
                await tx.employeeMovement.deleteMany({ where: { engagementId: { in: engagementIds } } })
                await tx.employeeObligation.deleteMany({ where: { engagementId: { in: engagementIds } } })
                await tx.employeeEngagement.deleteMany({ where: { id: { in: engagementIds } } })
            }
            await tx.employee.delete({ where: { id } })

            return {
                employeeId: id,
                deletedEngagements: engagementIds.length,
                deletedObligations: obligationCount,
                deletedMovements: movements.length,
                preservedFinancialTransactions: financialTransactionIds.length
            }
        })
    }

}

export default new EmployeesRepository()
