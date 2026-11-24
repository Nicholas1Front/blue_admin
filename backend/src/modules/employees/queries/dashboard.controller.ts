import type { Request, Response } from 'express'
import { AppError } from '../../../shared/errors/AppError.js'
import dashboardService from './dashboard.service.js'
import { employeeDashboardQuerySchema } from './dashboard.schema.js'

class EmployeesDashboardController {
    async findDashboard(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')

        const query = employeeDashboardQuerySchema.parse(req.query)
        const dashboard = await dashboardService.findDashboard(query)

        return res.status(200).json({
            message: 'Employee dashboard found successfully',
            data: dashboard
        })
    }
}

export default new EmployeesDashboardController()
