import{Request,Response} from 'express';
import { AppError } from '../../../shared/errors/AppError.js'
import activityService from './activity.service.js'
import { 
    addActivitySchema, 
    updateActivitySchema,
    findActivitiesByFiltersSchema
} from './activity.schema.js'

class ActivityController{
    async addActivity(
        req : Request,
        res : Response
    ){
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        const data = addActivitySchema.parse(req.body);

        const activity = await activityService.addActivity(
            req.params.serviceId as string,
            data
        )

        return res.status(200).json({
            message : "Activity successfully added in service",
            data : activity
        })
    }

    async updateActivity(
        req : Request,
        res : Response
    ){
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        const data = updateActivitySchema.parse(req.body)

        const activity = await activityService.updateActivity(
            req.params.id as string,
            data
        )

        return res.status(200).json({
            message : "Activity successfully updated",
            data : activity
        })
    }

    async findActivitiesByServiceId(
        req : Request,
        res : Response
    ){
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        const activities = await activityService.findActivitiesByServiceId(
            req.params.serviceId as string
        )

        return res.status(200).json({
            message : 'Activities from service founded successfully',
            data : activities
        })
    }

    async findActivitiesByFilters(
        req : Request,
        res : Response
    ){
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        const filters = findActivitiesByFiltersSchema.parse(req.query)

        const activities = await activityService.findActivitiesByFilters(filters)

        return res.status(200).json({
            message : 'Activities founded successfully using filters',
            data : activities
        })
    }

    async deleteActivity(
        req : Request,
        res : Response
    ){
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        await activityService.deleteActivityById(req.params.id as string)

        return res.status(200).json({
            message : 'Activity deleted successfully'
        })
    }
}

export default new ActivityController()