import { AppError } from '../../../shared/errors/AppError.js'
import dashboardRepository from './dashboard.repository.js'
import type { employeeDashboardQueryDTO } from './dashboard.schema.js'

class EmployeesDashboardService {
    async findDashboard(query: employeeDashboardQueryDTO) {
        const dashboard = await dashboardRepository.findDashboard(query)
        if ('invalidCursor' in dashboard) {
            throw new AppError('Pagination cursor does not belong to an employee movement', 400, 'INVALID_CURSOR')
        }
        return dashboard
    }
}

export default new EmployeesDashboardService()
