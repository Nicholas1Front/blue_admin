import { AppError } from './../../shared/errors/AppError.js';
import { 
    createServiceSchema,
    updateServiceSchema,
    updateStatusServiceSchema,
    findServicesByFilters
} from './services.schema.js';
import {Request, Response} from 'express';
import servicesService from './services.service.js'

class ServicesController{
    async createService(
        req : Request,
        res : Response
    ){
        if(!req.user){
            throw new AppError('User not authenticated',401,'USER_NOT_AUTHENTICATED')
        }

        const data = createServiceSchema.parse(req.body);

        const service = await servicesService.createService(data);

        return res.status(200).json({
            message : "Service with history created successfully",
            data : service
        })
    }

    async updateService(
        req : Request,
        res : Response
    ){
        if(!req.user){
            throw new AppError('User not authenticated',401,'USER_NOT_AUTHENTICATED')
        }

        const data = updateServiceSchema.parse(req.body)

        const service = await servicesService.updateService(
            req.params.id as string,
            data
        )

        return res.status(200).json({
            message : "Service with history updated successfully",
            data : service
        })
    }

    async updateServiceStatus(
        req : Request,
        res : Response
    ){
        if(!req.user){
            throw new AppError('User not authenticated',401,'USER_NOT_AUTHENTICATED')
        }

        const data = updateStatusServiceSchema.parse(req.body)

        const service = await servicesService.updateServiceStatus(
            req.params.id as string,
            data
        )

        return res.status(200).json({
            message : 'Status of service and history updated successfully',
            data : service
        })
    }

    async findServiceByFilters(
        req : Request,
        res : Response
    ){
        if(!req.user){
            throw new AppError('User not authenticated',401,'USER_NOT_AUTHENTICATED')
        }

        const data = findServicesByFilters.parse(req.query)

        const services = await servicesService.findServicesByFilters(data);

        return res.status(200).json({
            message : 'Services founded successfully',
            data : services
        })
    }

    async deleteServiceById(
        req : Request,
        res : Response
    ){
        if(!req.user){
            throw new AppError('User not authenticated',401,'USER_NOT_AUTHENTICATED')
        }

        await servicesService.deleteServiceById(req.params.id as string)

        return res.status(200).json({
            message : "Service and history deleted successfully"
        })
    }
    
}

export default new ServicesController();
