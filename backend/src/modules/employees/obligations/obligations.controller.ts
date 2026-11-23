import type { Request, Response } from 'express'
import { AppError } from '../../../shared/errors/AppError.js'
import {
    analyzeObligationsQuerySchema,
    createObligationSchema,
    createObligationsBatchSchema,
    updateObligationSchema
} from './obligations.schema.js'
import obligationsService from './obligations.service.js'

class ObligationsController {
    async analyzeObligations(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')

        const query = analyzeObligationsQuerySchema.parse(req.query)
        const analysis = await obligationsService.analyzeObligations(
            req.params.engagementId as string,
            query
        )

        return res.status(200).json({
            message: 'Employee obligations analyzed successfully',
            data: analysis
        })
    }

    async createObligationsBatch(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')

        const data = createObligationsBatchSchema.parse(req.body)
        const obligations = await obligationsService.createObligationsBatch(
            req.params.engagementId as string,
            data
        )

        return res.status(201).json({
            message: 'Employee obligations created successfully',
            data: obligations
        })
    }

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

    async findOpenObligations(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')

        const obligations = await obligationsService.findOpenObligations(
            req.params.engagementId as string
        )

        return res.status(200).json({
            message: 'Open employee obligations found successfully',
            data: obligations
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
