import { Request, Response } from 'express'
import { AppError } from '../../../shared/errors/AppError.js'
import movementsService from './movements.service.js'
import { criarMovimentacaoSchema, estornarMovimentacaoSchema } from './movements.schema.js'

class MovementsController {
    async create(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = criarMovimentacaoSchema.parse(req.body)
        const movement = await movementsService.create(data, req.user.id)
        return res.status(201).json({ message: 'Employee movement created successfully', data: movement })
    }

    async reverse(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = estornarMovimentacaoSchema.parse(req.body)
        const movement = await movementsService.reverse(req.params.id as string, data, req.user.id)
        return res.status(200).json({ message: 'Employee movement reversed successfully', data: movement })
    }
}

export default new MovementsController()
