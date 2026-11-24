import { AppError } from '../../shared/errors/AppError.js'
import employeesRepository from './employees.repository.js'
import type { createEmployeeDTO, findEmployeesByFiltersDTO, updateEmployeeDTO } from './employees.schema.js'

class EmployeesService {
    async createEmployee(data: createEmployeeDTO) {
        return employeesRepository.createEmployee(data)
    }

    async updateEmployee(id: string, data: updateEmployeeDTO) {
        const employee = await employeesRepository.findEmployeeById(id)
        if (!employee) throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND')

        const changes: Record<string, { previous: string | null; current: string | null }> = {}
        const historyValue = (value: string | Date | null) => value instanceof Date ? value.toISOString() : value

        for (const field of ['name', 'document', 'address', 'birthDate', 'observations'] as const) {
            const nextValue = data[field]
            if (nextValue === undefined) continue

            const previousValue = employee[field]
            const normalizedPrevious = previousValue instanceof Date ? previousValue.getTime() : previousValue
            const normalizedNext = nextValue instanceof Date ? nextValue.getTime() : nextValue
            if (normalizedPrevious === normalizedNext) continue

            changes[field] = {
                previous: historyValue(previousValue),
                current: historyValue(nextValue)
            }
        }

        if (Object.keys(changes).length === 0) return { employee, history: null }

        return employeesRepository.updateEmployee(id, data, changes)
    }

    async findEmployeesByFilters(filters: findEmployeesByFiltersDTO) {
        const result = await employeesRepository.findEmployeesByFilters(filters)
        if ('invalidCursor' in result) {
            throw new AppError('Pagination cursor does not match the employee filters', 400, 'INVALID_CURSOR')
        }
        return result
    }

    async findEmployeeById(id: string) {
        const employee = await employeesRepository.findEmployeeById(id)
        if (!employee) throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND')
        return employee
    }
}

export default new EmployeesService()
