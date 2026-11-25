import { AppError } from '../../../../shared/errors/AppError.js'
import employeeSummaryRepository from '../repositories/employee-engagement-summary.repository.js'
import type { employeeSummaryQueryDTO } from '../queries.schema.js'

class EmployeeSummaryService {
    async findEmployeeEngagementSummaries(query: employeeSummaryQueryDTO) {
        const result = await employeeSummaryRepository.findEmployeeEngagementSummaries(query)
        if ('invalidCursor' in result) {
            throw new AppError('Pagination cursor does not match the employee summary filters', 400, 'INVALID_CURSOR')
        }
        return result
    }
}

export default new EmployeeSummaryService()
