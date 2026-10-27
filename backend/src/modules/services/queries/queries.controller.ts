import {Request, Response} from 'express'
import {AppError} from '../../../shared/errors/AppError.js'
import queriesService from './queries.service.js'
import {
    findServiceByIdParamsSchema,
    findServicesByFiltersQuerySchema,
    serviceDashboardQuerySchema
} from './queries.schema.js'

class QueriesController {
    async findServiceDashboard(req : Request, res : Response) {
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        const filters = serviceDashboardQuerySchema.parse(req.query)
        const dashboard = await queriesService.findServiceDashboard(filters)

        return res.status(200).json({
            message : 'Service dashboard found successfully',
            data : dashboard
        })
    }

    async findServicesByAdvancedFilters(req : Request, res : Response) {
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        const filters = findServicesByFiltersQuerySchema.parse(req.query)
        const result = await queriesService.findServicesByAdvancedFilters(filters)

        return res.status(200).json({
            message : 'Services found successfully',
            data : result
        })
    }

    async findServiceById(req : Request, res : Response) {
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        const {serviceId} = findServiceByIdParamsSchema.parse(req.params)
        const service = await queriesService.findServiceById(serviceId)

        return res.status(200).json({
            message : 'Service details found successfully',
            data : service
        })
    }
}

export default new QueriesController()
