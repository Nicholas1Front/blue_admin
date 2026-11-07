import { Request, Response } from 'express'
import { AppError } from '../../shared/errors/AppError.js'
import vehiclesService from './vehicles.service.js'
import {
    createVehicleSchema,
    updateVehicleSchema,
    updateVehicleOdometerSchema
} from './vehicles.schema.js'

class VehiclesController {
    async create(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = createVehicleSchema.parse(req.body)
        const vehicle = await vehiclesService.create(data)

        return res.status(201).json({
            message: 'Vehicle created successfully',
            data: vehicle
        })
    }

    async update(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = updateVehicleSchema.parse(req.body)
        const vehicle = await vehiclesService.update(req.params.id as string, data)

        return res.status(200).json({
            message: 'Vehicle updated successfully',
            data: vehicle
        })
    }

    async updateOdometer(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = updateVehicleOdometerSchema.parse(req.body)
        const vehicle = await vehiclesService.updateOdometer(req.params.id as string, data)

        return res.status(200).json({
            message: data.isReset
                ? 'Vehicle odometer updated and reset registered successfully'
                : 'Vehicle odometer updated successfully',
            data: vehicle
        })
    }

    async delete(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        await vehiclesService.delete(req.params.id as string)

        return res.status(200).json({ message: 'Vehicle deleted successfully' })
    }
}

export default new VehiclesController()
