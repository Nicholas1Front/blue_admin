import { Request, Response } from 'express'
import { AppError } from '../../../shared/errors/AppError.js'
import budgetQueriesService from './queries.service.js'
import { findBudgetByIdParamsSchema } from './queries.schema.js'

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
}

export default new BudgetQueriesController()
