import type { Request, Response } from 'express'
import { AppError } from '../../../shared/errors/AppError.js'
import {
    createObligationSchema,
    updateObligationSchema
} from './obligations.schema.js'
import obligationsService from './obligations.service.js'

class ObligationsController {
    async createObligation(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')

        const data = createObligationSchema.parse(req.body)
        const obligation = await obligationsService.createObligation(req.params.engagementId as string, data)

        return res.status(201).json({
            message: 'Employee obligation created successfully',
            data: obligation
        })
    }

    async updateObligation(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')

        const data = updateObligationSchema.parse(req.body)
        const obligation = await obligationsService.updateObligation(
            req.params.engagementId as string,
            req.params.obligationId as string,
            data
        )

        return res.status(200).json({
            message: 'Employee obligation updated successfully',
            data: obligation
        })
    }

    async findObligationsByEngagement(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')

        const obligations = await obligationsService.findObligationsByEngagement(
            req.params.engagementId as string
        )

        return res.status(200).json({
            message: 'Employee obligations found successfully',
            data: obligations
        })
    }

    async deleteObligation(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')

        await obligationsService.deleteObligation(
            req.params.engagementId as string,
            req.params.obligationId as string
        )

        return res.status(200).json({
            message: 'Employee obligation deleted successfully'
        })
    }
}

export default new ObligationsController()
