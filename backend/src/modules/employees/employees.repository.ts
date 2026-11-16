import { prisma } from '../../shared/database/prisma.js'
import type { createEmployeeDTO, updateEmployeeDTO, findEmployeesByFiltersDTO } from './employees.dto.js'

class EmployeesRepository {
    async createEmployee(data: createEmployeeDTO) {
        return prisma.$transaction(async tx => {
            const employee = await tx.employee.create({
                data: {
                    name: data.name,
                    document: data.document ?? null,
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
                        document: employee.document
                    },
                    eventDate: new Date()
                }
            })

            return { employee, history }
        })
    }

    async findEmployeeById(id: string) {
        return prisma.employee.findUnique({
            where: { id }
        })
    }

    async findAllEmployees() {
        return prisma.employee.findMany({
            orderBy: { name: 'asc' }
        })
    }

    async findEmployeesByFilters(filters: findEmployeesByFiltersDTO) {
        return prisma.employee.findMany({
            where: {
                ...(filters.id !== undefined && {
                    id: { contains: filters.id, mode: 'insensitive' }
                }),
                ...(filters.name !== undefined && {
                    name: { contains: filters.name, mode: 'insensitive' }
                }),
                ...(filters.document !== undefined && {
                    document: { contains: filters.document, mode: 'insensitive' }
                })
            },
            orderBy: { name: 'asc' }
        })
    }

    async updateEmployee(id: string, data: updateEmployeeDTO, changes: Record<string, { previous: string | null; current: string | null }>) {
        return prisma.$transaction(async tx => {
            const employee = await tx.employee.update({
                where: { id },
                data
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
}

export default new EmployeesRepository()
