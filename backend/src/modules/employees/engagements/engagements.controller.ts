import { Request, Response } from 'express'
import { AppError } from '../../../shared/errors/AppError.js'
import engagementsService from './engagements.service.js'
import { atualizarVinculoSchema, criarVinculoSchema, encerrarVinculoSchema } from './engagements.schema.js'

class EngagementsController {
    async create(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = criarVinculoSchema.parse(req.body)
        const engagement = await engagementsService.create(data, req.user.id)
        return res.status(201).json({ message: 'Employee engagement created successfully', data: engagement })
    }

    async update(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = atualizarVinculoSchema.parse(req.body)
        const engagement = await engagementsService.update(req.params.id as string, data, req.user.id)
        return res.status(200).json({ message: 'Employee engagement updated successfully', data: engagement })
    }

    async close(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = encerrarVinculoSchema.parse(req.body)
        const engagement = await engagementsService.close(req.params.id as string, data, req.user.id)
        return res.status(200).json({ message: 'Employee engagement ended successfully', data: engagement })
    }
}

export default new EngagementsController()
