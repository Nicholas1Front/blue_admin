import type { Request, Response } from 'express'
import { AppError } from '../../../shared/errors/AppError.js'
import {
    createEngagementSchema,
    updateEngagementSchema,
    findEngagementsByFiltersSchema
} from './engagements.schema.js'
import engagementsService from './engagements.service.js'

class EngagementsController {
    async createEngagement(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')

        const data = createEngagementSchema.parse(req.body)
        const engagement = await engagementsService.createEngagement(req.params.employeeId as string, data)

        return res.status(201).json({
            message: 'Employee engagement created successfully',
            data: engagement
        })
    }

    async updateEngagement(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')

        const data = updateEngagementSchema.parse(req.body)
        const engagement = await engagementsService.updateEngagement(
            req.params.employeeId as string,
            req.params.engagementId as string,
            data
        )

        return res.status(200).json({
            message: 'Employee engagement updated successfully',
            data: engagement
        })
    }

    async findEngagementsByEmployee(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')

        const filters = findEngagementsByFiltersSchema.parse(req.query)
        const engagements = await engagementsService.findEngagementsByEmployee(
            req.params.employeeId as string,
            filters
        )

        return res.status(200).json({
            message: 'Employee engagements found successfully',
            data: engagements
        })
    }
}

export default new EngagementsController()
