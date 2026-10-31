import { Request, Response } from 'express'
import { AppError } from '../../../shared/errors/AppError.js'
import budgetCategoryService from './categories.service.js'
import { createBudgetCategorySchema, updateBudgetCategorySchema } from './categories.schema.js'

class BudgetCategoryController {
    async create(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = createBudgetCategorySchema.parse(req.body)
        const category = await budgetCategoryService.create(data)

        return res.status(201).json({ message: 'Budget category created successfully', data: category })
    }

    async update(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = updateBudgetCategorySchema.parse(req.body)
        const category = await budgetCategoryService.update(req.params.id as string, data)

        return res.status(200).json({ message: 'Budget category updated successfully', data: category })
    }

    async findAll(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const categories = await budgetCategoryService.findAll()

        return res.status(200).json({ message: 'Budget categories found successfully', data: categories })
    }

    async deactivate(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const category = await budgetCategoryService.setActive(req.params.id as string, false)

        return res.status(200).json({ message: 'Budget category deactivated successfully', data: category })
    }

    async activate(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const category = await budgetCategoryService.setActive(req.params.id as string, true)

        return res.status(200).json({ message: 'Budget category activated successfully', data: category })
    }
}

export default new BudgetCategoryController()
