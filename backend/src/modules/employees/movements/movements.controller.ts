import type { Request, Response } from 'express'
import { AppError } from '../../../shared/errors/AppError.js'
import {
    createMovementSchema,
    createPaymentSchema,
    findMovementsQuerySchema,
    updateMovementSchema,
    updatePaymentSchema
} from './movements.schema.js'
import movementsService from './movements.service.js'

class MovementsController {
    async createMovement(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')

        const data = createMovementSchema.parse(req.body)
        const movement = await movementsService.createMovement(
            req.params.engagementId as string,
            data
        )

        return res.status(201).json({
            message: 'Employee movement created successfully',
            data: movement
        })
    }

    async createPayment(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')

        const data = createPaymentSchema.parse(req.body)
        const payment = await movementsService.createPayment(
            req.params.engagementId as string,
            data
        )

        return res.status(201).json({
            message: 'Employee payment created successfully',
            data: payment
        })
    }

    async updateMovement(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')

        const data = updateMovementSchema.parse(req.body)
        const movement = await movementsService.updateMovement(
            req.params.engagementId as string,
            req.params.movementId as string,
            data
        )

        return res.status(200).json({
            message: 'Employee movement updated successfully',
            data: movement
        })
    }

    async updatePayment(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')

        const data = updatePaymentSchema.parse(req.body)
        const payment = await movementsService.updatePayment(
            req.params.engagementId as string,
            req.params.movementId as string,
            data
        )

        return res.status(200).json({
            message: 'Employee payment updated successfully',
            data: payment
        })
    }

    async deleteMovement(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')

        await movementsService.deleteMovement(
            req.params.engagementId as string,
            req.params.movementId as string
        )

        return res.status(200).json({
            message: 'Employee movement deleted successfully'
        })
    }

    async findMovementsByEngagement(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')

        const filters = findMovementsQuerySchema.parse(req.query)
        const movements = await movementsService.findMovementsByEngagement(
            req.params.engagementId as string,
            filters
        )

        return res.status(200).json({
            message: 'Employee movements found successfully',
            data: movements
        })
    }

    async findMovementById(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')

        const movement = await movementsService.findMovementById(
            req.params.engagementId as string,
            req.params.movementId as string
        )

        return res.status(200).json({
            message: 'Employee movement found successfully',
            data: movement
        })
    }

}

export default new MovementsController()
