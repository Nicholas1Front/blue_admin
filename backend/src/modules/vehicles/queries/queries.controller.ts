import { Request, Response } from 'express'
import { AppError } from '../../../shared/errors/AppError.js'
import vehicleQueriesService from './queries.service.js'
import {
    findVehicleHistoryByPeriodParamsSchema,
    findVehicleHistoryByPeriodQuerySchema,
    findVehiclesByAdvancedFiltersSchema,
    vehicleDashboardQuerySchema
} from './queries.schema.js'

class VehicleQueriesController {
    async findVehicleWithHistoryByPeriod(req: Request, res: Response) {
        if (!req.user) {
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        const { vehicleId } = findVehicleHistoryByPeriodParamsSchema.parse(req.params)
        const filters = findVehicleHistoryByPeriodQuerySchema.parse(req.query)
        const result = await vehicleQueriesService.findVehicleWithHistoryByPeriod(vehicleId, filters)

        return res.status(200).json({
            message: 'Vehicle history found successfully for the selected period',
            data: result
        })
    }

    async findVehicleDashboard(req: Request, res: Response) {
        if (!req.user) {
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        const filters = vehicleDashboardQuerySchema.parse(req.query)
        const result = await vehicleQueriesService.findVehicleDashboard(filters)

        return res.status(200).json({
            message: 'Vehicle dashboard found successfully',
            data: result
        })
    }

    async findVehiclesByAdvancedFilters(req: Request, res: Response) {
        if (!req.user) {
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        const filters = findVehiclesByAdvancedFiltersSchema.parse(req.query)
        const result = await vehicleQueriesService.findVehiclesByAdvancedFilters(filters)

        return res.status(200).json({
            message: 'Vehicles found successfully using advanced filters',
            data: result
        })
    }
}

export default new VehicleQueriesController()
