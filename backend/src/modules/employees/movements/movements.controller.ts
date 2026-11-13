import { Request, Response } from 'express'
import { AppError } from '../../../shared/errors/AppError.js'
import movementsService from './movements.service.js'
import { criarMovimentacaoSchema } from './movements.schema.js'

class MovementsController {
    async create(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = criarMovimentacaoSchema.parse(req.body)
        const movement = await movementsService.create(data, req.user.id)
        return res.status(201).json({ message: 'Employee movement created successfully', data: movement })
    }
}

export default new MovementsController()
