import { Request, Response } from 'express'
import { AppError } from '../../../shared/errors/AppError.js'
import vehicleHistoryService from './history.service.js'
import {
    createVehicleHistorySchema,
    updateVehicleHistorySchema
} from './history.schema.js'

class VehicleHistoryController {
    async create(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = createVehicleHistorySchema.parse(req.body)
        const history = await vehicleHistoryService.create(req.params.vehicleId as string, data)

        return res.status(201).json({
            message: 'Vehicle history record created successfully',
            data: history
        })
    }

    async update(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = updateVehicleHistorySchema.parse(req.body)
        const history = await vehicleHistoryService.update(req.params.historyId as string, data)

        return res.status(200).json({
            message: 'Vehicle history record updated successfully',
            data: history
        })
    }

    async delete(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        await vehicleHistoryService.delete(req.params.historyId as string)

        return res.status(200).json({ message: 'Vehicle history record deleted successfully' })
    }
}

export default new VehicleHistoryController()
