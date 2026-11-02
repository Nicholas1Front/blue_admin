import { Request, Response } from 'express'
import { AppError } from '../../../shared/errors/AppError.js'
import budgetQueriesService from './queries.service.js'
import {
    budgetDashboardQuerySchema,
    budgetMetricsQuerySchema,
    findBudgetByIdParamsSchema,
    findBudgetsByAdvancedFiltersSchema
} from './queries.schema.js'

class BudgetQueriesController {
    async findBudgetById(req: Request, res: Response) {
        if (!req.user) {
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        const { id } = findBudgetByIdParamsSchema.parse(req.params)
        const budget = await budgetQueriesService.findBudgetById(id)

        return res.status(200).json({
            message: 'Budget details found successfully',
            data: budget
        })
    }

    async findBudgetDashboard(req: Request, res: Response) {
        if (!req.user) {
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        const filters = budgetDashboardQuerySchema.parse(req.query)
        const dashboard = await budgetQueriesService.findBudgetDashboard(filters)

        return res.status(200).json({
            message: 'Budget dashboard found successfully',
            data: dashboard
        })
    }

    async findBudgetYearlyMetrics(req: Request, res: Response) {
        if (!req.user) {
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        const filters = budgetMetricsQuerySchema.parse(req.query)
        const metrics = await budgetQueriesService.findBudgetYearlyMetrics(filters)

        return res.status(200).json({
            message: 'Budget yearly metrics found successfully',
            data: metrics
        })
    }

    async findBudgetsByAdvancedFilters(req: Request, res: Response) {
        if (!req.user) {
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        const filters = findBudgetsByAdvancedFiltersSchema.parse(req.query)
        const result = await budgetQueriesService.findBudgetsByAdvancedFilters(filters)

        return res.status(200).json({
            message: 'Budgets found successfully using advanced filters',
            data: result
        })
    }
}

export default new BudgetQueriesController()
