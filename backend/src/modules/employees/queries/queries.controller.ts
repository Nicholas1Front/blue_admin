import type { Request, Response } from 'express'
import { AppError } from '../../../shared/errors/AppError.js'
import employeeOverviewService from './services/employee-overview.service.js'
import dashboardService from './services/dashboard.service.js'
import consistencyService from './services/consistency.service.js'
import employeeSummaryService from './services/employee-engagement-summary.service.js'
import {
    employeeOverviewQuerySchema,
    employeeDashboardQuerySchema,
    employeeSummaryQuerySchema
} from './queries.schema.js'

class EmployeesQueriesController {
    async findEmployeeOverview(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')

        const query = employeeOverviewQuerySchema.parse(req.query)
        const overview = await employeeOverviewService.findEmployeeOverview(
            req.params.employeeId as string,
            query
        )

        return res.status(200).json({
            message: 'Employee overview found successfully',
            data: overview
        })
    }


    async findEmployeeEngagementSummaries(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')

        const query = employeeSummaryQuerySchema.parse(req.query)
        const summaries = await employeeSummaryService.findEmployeeEngagementSummaries(query)
        return res.status(200).json({
            message: 'Employee engagement summaries found successfully',
            data: summaries
        })
    }

    async findDashboard(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')

        const query = employeeDashboardQuerySchema.parse(req.query)
        const dashboard = await dashboardService.findDashboard(query)

        return res.status(200).json({
            message: 'Employee dashboard found successfully',
            data: dashboard
        })
    }

    async analyzeEmployee(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')

        const analysis = await consistencyService.analyzeEmployee(req.params.employeeId as string)
        return res.status(200).json({
            message: 'Employee financial consistency analyzed successfully',
            data: analysis
        })
    }
}

export default new EmployeesQueriesController()
