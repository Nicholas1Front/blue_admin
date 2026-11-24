import { AppError } from '../../../shared/errors/AppError.js'
import employeesRepository from '../employees.repository.js'
import employeesQueriesRepository from './queries.repository.js'
import type { employeeOverviewQueryDTO } from './queries.schema.js'

class EmployeesQueriesService {
    async findEmployeeOverview(employeeId: string, query: employeeOverviewQueryDTO) {
        const employee = await employeesRepository.findEmployeeById(employeeId)
        if (!employee) throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND')

        const overview = await employeesQueriesRepository.findEmployeeOverview(employeeId, query)
        if (!overview) throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND')
        return overview
    }
}

export default new EmployeesQueriesService()
