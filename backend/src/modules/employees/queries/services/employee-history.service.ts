import { AppError } from '../../../../shared/errors/AppError.js'
import employeeHistoryRepository from '../repositories/employee-history.repository.js'
import type { employeeHistoryQueryDTO } from '../queries.schema.js'

class EmployeeHistoryService {
    async findEmployeeHistory(employeeId: string, query: employeeHistoryQueryDTO) {
        const history = await employeeHistoryRepository.findEmployeeHistory(employeeId, query)
        if (!history) throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND')
        if ('invalidCursor' in history) {
            throw new AppError('Pagination cursor does not belong to this employee history', 400, 'INVALID_CURSOR')
        }
        return history
    }
}

export default new EmployeeHistoryService()
