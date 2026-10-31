import { Request, Response } from 'express'
import { AppError } from '../../../shared/errors/AppError.js'
import budgetItemService from './items.service.js'
import { createBudgetItemSchema, updateBudgetItemSchema } from './items.schema.js'

class BudgetItemController {
    async create(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = createBudgetItemSchema.parse(req.body)
        const item = await budgetItemService.create(req.params.budgetId as string, data)

        return res.status(201).json({ message: 'Budget item created successfully', data: item })
    }

    async update(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = updateBudgetItemSchema.parse(req.body)
        const item = await budgetItemService.update(req.params.id as string, data)

        return res.status(200).json({ message: 'Budget item updated successfully', data: item })
    }

    async findByBudgetId(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const items = await budgetItemService.findByBudgetId(req.params.budgetId as string)

        return res.status(200).json({ message: 'Budget items found successfully', data: items })
    }

    async delete(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const result = await budgetItemService.delete(req.params.id as string)

        return res.status(200).json({ message: 'Budget item deleted successfully', data: result })
    }
}

export default new BudgetItemController()
