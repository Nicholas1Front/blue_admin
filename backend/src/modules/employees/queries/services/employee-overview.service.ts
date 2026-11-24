import { AppError } from '../../../../shared/errors/AppError.js'
import employeesQueriesRepository from '../repositories/employee-overview.repository.js'
import type { employeeOverviewQueryDTO } from '../queries.schema.js'

class EmployeesQueriesService {
    async findEmployeeOverview(employeeId: string, query: employeeOverviewQueryDTO) {
        const overview = await employeesQueriesRepository.findEmployeeOverview(employeeId, query)
        if (!overview) throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND')
        if ('invalidCursor' in overview) throw new AppError('Pagination cursor does not belong to this employee', 400, 'INVALID_CURSOR')
        return overview
    }
}

export default new EmployeesQueriesService()
