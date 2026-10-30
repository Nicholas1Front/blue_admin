import {Request, Response} from 'express'
import {AppError} from '../../../shared/errors/AppError.js'
import queriesService from './queries.service.js'
import {
    findServiceByIdParamsSchema,
    findServicesByFiltersQuerySchema,
    serviceCalendarQuerySchema,
    serviceDashboardQuerySchema,
    serviceMetricsQuerySchema
} from './queries.schema.js'

class QueriesController {
    async findServiceMetrics(req : Request, res : Response) {
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }
        const filters = serviceMetricsQuerySchema.parse(req.query)
        const metrics = await queriesService.findServiceMetrics(filters)
        return res.status(200).json({message : 'Service metrics found successfully', data : metrics})
    }

    async findServicesForCalendar(req : Request, res : Response) {
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }
        const filters = serviceCalendarQuerySchema.parse(req.query)
        const calendar = await queriesService.findServicesForCalendar(filters)
        return res.status(200).json({message : 'Service calendar found successfully', data : calendar})
    }
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
