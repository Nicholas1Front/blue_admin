import { AppError } from '../../shared/errors/AppError.js'
import { removeUndefined } from '../../shared/helpers/objects/removeUndefined.js'
import employeesRepository from './employees.repository.js'
import type { createEmployeeDTO, updateEmployeeDTO, findEmployeesByFiltersDTO } from './employees.dto.js'

class EmployeesService {
    async createEmployee(data: createEmployeeDTO) {
        return employeesRepository.createEmployee(data)
    }

    async updateEmployee(id: string, data: updateEmployeeDTO) {
        const employee = await employeesRepository.findEmployeeById(id)
        if (!employee) throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND')

        const cleanedData = removeUndefined(data)
        const changes: Record<string, { previous: string | null; current: string | null }> = {}

        for (const field of ['name', 'document', 'observations'] as const) {
            const nextValue = cleanedData[field]
            if (nextValue === undefined) continue

            const previousValue = employee[field]
            if (previousValue === nextValue) continue

            changes[field] = {
                previous: previousValue,
                current: nextValue
            }
        }

        if (Object.keys(changes).length === 0) return { employee, history: null }

        return employeesRepository.updateEmployee(id, cleanedData, changes)
    }

    async findEmployeeById(id: string) {
        const employee = await employeesRepository.findEmployeeById(id)
        if (!employee) throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND')
        return employee
    }

    async findAllEmployees() {
        return employeesRepository.findAllEmployees()
    }

    async findEmployeesByFilters(filters: findEmployeesByFiltersDTO) {
        return employeesRepository.findEmployeesByFilters(removeUndefined(filters))
    }
}

export default new EmployeesService()
