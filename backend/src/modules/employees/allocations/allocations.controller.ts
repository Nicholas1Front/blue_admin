import { Request, Response } from 'express'
import { AppError } from '../../../shared/errors/AppError.js'
import allocationsService from './allocations.service.js'
import { aplicarAdiantamentoSchema, registrarPagamentoSchema } from './allocations.schema.js'

class AllocationsController {
    async registerPayment(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = registrarPagamentoSchema.parse(req.body)
        const result = await allocationsService.registerPayment(data, req.user.id)
        return res.status(201).json({ message: 'Employee payment registered successfully', data: result })
    }

    async applyAdvance(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = aplicarAdiantamentoSchema.parse(req.body)
        const result = await allocationsService.applyAdvance(data, req.user.id)
        return res.status(201).json({ message: 'Advance credit applied successfully', data: result })
    }
}

export default new AllocationsController()
