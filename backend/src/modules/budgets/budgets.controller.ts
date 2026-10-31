import { Request, Response } from 'express'
import { AppError } from '../../shared/errors/AppError.js'
import budgetService from './budgets.service.js'
import { createBudgetSchema, updateBudgetSchema } from './budgets.schema.js'

class BudgetController {
    async create(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = createBudgetSchema.parse(req.body)
        const budget = await budgetService.create(data)

        return res.status(201).json({ message: 'Budget created successfully', data: budget })
    }

    async update(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = updateBudgetSchema.parse(req.body)
        const budget = await budgetService.update(req.params.id as string, data)

        return res.status(200).json({ message: 'Budget updated successfully', data: budget })
    }

    async findById(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const budget = await budgetService.findById(req.params.id as string)

        return res.status(200).json({ message: 'Budget found successfully', data: budget })
    }

    async findAll(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const budgets = await budgetService.findAll()

        return res.status(200).json({ message: 'Budgets found successfully', data: budgets })
    }

    async delete(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        await budgetService.delete(req.params.id as string)

        return res.status(200).json({ message: 'Budget and its history deleted successfully' })
    }
}

export default new BudgetController()
