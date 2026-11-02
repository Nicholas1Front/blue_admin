import { Request, Response } from 'express'
import { AppError } from '../../../shared/errors/AppError.js'
import budgetPriceService from './prices.service.js'
import {
    createBudgetPriceSchema,
    findBudgetPricesByFiltersSchema,
    updateBudgetPriceSchema
} from './prices.schema.js'

class BudgetPriceController {
    async create(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = createBudgetPriceSchema.parse(req.body)
        const price = await budgetPriceService.create(data)
        return res.status(201).json({ message: 'Budget price created successfully', data: price })
    }

    async update(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = updateBudgetPriceSchema.parse(req.body)
        const price = await budgetPriceService.update(req.params.id as string, data)
        return res.status(200).json({ message: 'Budget price updated successfully', data: price })
    }

    async findById(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const price = await budgetPriceService.findById(req.params.id as string)
        return res.status(200).json({ message: 'Budget price found successfully', data: price })
    }

    async findByFilters(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const filters = findBudgetPricesByFiltersSchema.parse(req.query)
        const result = await budgetPriceService.findByFilters(filters)
        return res.status(200).json({ message: 'Budget prices found successfully using filters', data: result })
    }

    async delete(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        await budgetPriceService.delete(req.params.id as string)
        return res.status(200).json({ message: 'Budget price deleted successfully' })
    }
}

export default new BudgetPriceController()
