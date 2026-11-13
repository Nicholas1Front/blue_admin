import { Request, Response } from 'express'
import { AppError } from '../../../shared/errors/AppError.js'
import obligationsService from './obligations.service.js'
import { atualizarObrigacaoSchema, cancelarObrigacaoSchema, criarObrigacaoSchema, revisarObrigacaoSchema } from './obligations.schema.js'

class ObligationsController {
    async create(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = criarObrigacaoSchema.parse(req.body)
        const obligation = await obligationsService.create(data, req.user.id)
        return res.status(201).json({ message: 'Employee obligation created for review', data: obligation })
    }

    async update(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = atualizarObrigacaoSchema.parse(req.body)
        const obligation = await obligationsService.update(req.params.id as string, data, req.user.id)
        return res.status(200).json({ message: 'Employee obligation updated successfully', data: obligation })
    }

    async review(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = revisarObrigacaoSchema.parse(req.body)
        const obligation = await obligationsService.review(req.params.id as string, data, req.user.id)
        return res.status(200).json({ message: 'Employee obligation confirmed successfully', data: obligation })
    }

    async cancel(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = cancelarObrigacaoSchema.parse(req.body)
        const obligation = await obligationsService.cancel(req.params.id as string, data, req.user.id)
        return res.status(200).json({ message: 'Employee obligation canceled successfully', data: obligation })
    }
}

export default new ObligationsController()
