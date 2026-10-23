import activityRepository from "./activity.repository.js";
import type {
    addActivityDTO,
    updateActivityDTO,
    findActivitiesByFiltersDTO
} from './activity.schema.js'
import { AppError } from "../../../shared/errors/AppError.js";
import { removeUndefined } from "../../../shared/helpers/objects/removeUndefined.js";
import { undefinedToNull } from "../../../shared/helpers/objects/undefinedToNull.js";
import { allowedActivityStatus } from './../shared/allowedActivityStatus.js';

class ActivityService{
    async addActivity(
        serviceId : string,
        data : addActivityDTO
    ){
        const cleanedData = undefinedToNull(data)

        const serviceExists = await activityRepository.findServiceById(serviceId);

        if(!serviceExists){
            throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND')
        }

        if(!allowedActivityStatus.includes(cleanedData.status)){
            throw new AppError('Invalid activity status', 400, 'INVALID_ACTIVITY_STATUS')
        }

        if(
            cleanedData.startAt !== null &&
            cleanedData.endAt !== null &&
            cleanedData.startAt > cleanedData.endAt
        ){
            throw new AppError('Activity start must be before its end', 400, 'INVALID_ACTIVITY_PERIOD')
        }

        const activity = await activityRepository.addActivity(
            serviceId,
            cleanedData.title,
            cleanedData.description,
            cleanedData.startAt,
            cleanedData.endAt,
            cleanedData.status
        )

        if(!activity){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        return {
            service : serviceExists,
            activity : activity
        }
    }

    async updateActivity(
        id : string,
        data : updateActivityDTO
    ){
        const activityExists = await activityRepository.findActivityById(id)

        if(!activityExists){
            throw new AppError('Activity not found', 404, "ACTIVITY_NOT_FOUND")
        }

        const cleanedData = removeUndefined(data);

        if(
            cleanedData.status !== undefined &&
            !allowedActivityStatus.includes(cleanedData.status)
        ){
            throw new AppError('Invalid activity status', 400, 'INVALID_ACTIVITY_STATUS')
        }

        const effectiveStartAt = cleanedData.startAt !== undefined
            ? cleanedData.startAt
            : activityExists.startAt
        const effectiveEndAt = cleanedData.endAt !== undefined
            ? cleanedData.endAt
            : activityExists.endAt

        if(
            effectiveStartAt !== null &&
            effectiveEndAt !== null &&
            effectiveStartAt > effectiveEndAt
        ){
            throw new AppError('Activity start must be before its end', 400, 'INVALID_ACTIVITY_PERIOD')
        }

        const activity = await activityRepository.updateActivity(
            id,
            cleanedData
        )

        if(!activity){
            throw new AppError('Activity not found', 404, 'ACTIVITY_NOT_FOUND')
        }

        const service = await activityRepository.findServiceById(activity.serviceId)

        if(!service){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        return {
            service : service,
            activity : activity
        }
    }

    async findActivitiesByServiceId(
        serviceId : string
    ){
        const serviceExists = await activityRepository.findServiceById(serviceId);

        if(!serviceExists){
            throw new AppError('Service not found', 404, "SERVICE_NOT_FOUND")
        }

        const activities = await activityRepository.findActivitiesByServiceId(serviceId)

        if(!activities){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        return {
            service : serviceExists,
            activity : activities
        }
    }

    async findActivitiesByFilters(
        filters : findActivitiesByFiltersDTO
    ){
        const cleanedFilters = removeUndefined(filters)

        const rawActivities = await activityRepository.findActivitiesByFilters(
            cleanedFilters.id,
            cleanedFilters.serviceId,
            cleanedFilters.title,
            cleanedFilters.description,
            cleanedFilters.startAt,
            cleanedFilters.endAt,
            cleanedFilters.status
        )

        const servicesIds = [...new Set(rawActivities.map(activity => activity.serviceId))]
        const rawServices = await activityRepository.findServicesByIds(servicesIds)

        if(!rawServices){
            throw new AppError('Internal server error', 500, "INTERNAL_SERVER_ERROR")
        }

        let results = new Array()

        rawServices.forEach(service =>{
            let result = {
                service : service,
                activities : new Array()
            }
            rawActivities.forEach(activity => {
                if(activity.serviceId === service.id){
                    result.activities.push(activity)
                }
            })
            results.push(result)
        })

        return results
    }

    async deleteActivityById(
        id : string
    ){
        const activityExists = await activityRepository.findActivityById(id)

        if(!activityExists){
            throw new AppError('Activity not found', 404, 'ACTIVITY_NOT_FOUND')
        }

        const result = await activityRepository.deleteActivity(id)

        if(!result){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        return true
    }
}

export default new ActivityService()
