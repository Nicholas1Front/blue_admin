
import {AppError} from '../../shared/errors/AppError.js'

//helpers
import { undefinedToNull } from '../../shared/helpers/objects/undefinedToNull.js'
import { removeUndefined } from './../../shared/helpers/objects/removeUndefined.js';
import {verifyForUpdate} from './shared/verifyClientAndEquipament.js'
import {allowedServiceStatus} from './shared/allowedServiceStatus.js'

import servicesRepository from './services.repository.js'

import type {
    createServiceDTO,
    updateServiceDTO,
    updateStatusServiceDTO,
    findServicesByFiltersDTO
} from './services.schema.js'

class ServicesService{
    async createService(
        data : createServiceDTO
    ){
        let cleanedData = undefinedToNull(data)

        const clientExists = await servicesRepository.clientExists(cleanedData.clientId)

        if(!clientExists){
            throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND')
        }

        const clientHasEquipament = await servicesRepository.clientHasEquipament(
            cleanedData.clientId,
            cleanedData.equipamentId
        )

        if(!clientHasEquipament){
            throw new AppError('Client does not have this equipament', 404, 'CLIENT_DOES_NOT_HAVE_EQUIPAMENT')
        }

        if(cleanedData.costPerHour === true){
            const costPerHourValue = await servicesRepository.calculateCostPerHour()

            if(!costPerHourValue){
                throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
            }

            cleanedData.costPerHour = costPerHourValue
        }

        const service = await servicesRepository.createService(
            cleanedData.clientId,
            cleanedData.equipamentId,
            cleanedData.entryDate,
            cleanedData.exitDate,
            cleanedData.status,
            cleanedData.hoursWorked,
            cleanedData.costPerHour,
            cleanedData.eventType,
            cleanedData.description
        )

        if(!service){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        return service
    }

    async updateService(
        id : string,
        data : updateServiceDTO
    ){
        const serviceExists = await servicesRepository.findServiceById(id)

        if(!serviceExists){
            throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND')
        }

        if(serviceExists.history === undefined){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        const cleanedData = removeUndefined(data)

        if(cleanedData.clientId !== undefined){
            await verifyForUpdate(
                serviceExists,
                cleanedData
            )
        }

        if(cleanedData.costPerHour !== undefined && cleanedData.costPerHour === true){
            const costPerHourValue = await servicesRepository.calculateCostPerHour()

            if(!costPerHourValue){
                throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
            }

            cleanedData.costPerHour = costPerHourValue
        }

        if(cleanedData.costPerHour !== undefined && cleanedData.costPerHour === false){
            cleanedData.costPerHour = null
        }

        const updatedService = await servicesRepository.updateService(
            id,
            serviceExists.history.id,
            cleanedData
        )

        if(!updatedService){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        return updatedService
    }

    async updateServiceStatus(
        id : string,
        data : updateStatusServiceDTO
    ){
        const serviceExists = await servicesRepository.findServiceById(id)

        if(!serviceExists){
            throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND')
        }

        if(serviceExists.history === undefined){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        const cleanedData = removeUndefined(data);

        if(!allowedServiceStatus.includes(cleanedData.status)){
            throw new AppError('Invalid service status', 400, 'INVALID_SERVICE_STATUS')
        }

        const updatedService = await servicesRepository.updateServiceStatus(
            id,
            serviceExists.history.id,
            cleanedData
        )

        if(!updatedService){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        return updatedService
    }

    async findServicesByFilters(
        filters : findServicesByFiltersDTO
    ){
        const cleanedFilters = removeUndefined(filters);

        const rawServices = await servicesRepository.findServiceByFilters(
            cleanedFilters.id,
            cleanedFilters.clientId,
            cleanedFilters.equipamentId,
            cleanedFilters.entryDate,
            cleanedFilters.exitDate,
            cleanedFilters.status,
            cleanedFilters.hoursWorked,
            cleanedFilters.costPerHour,
            cleanedFilters.titheTransactionId,
            cleanedFilters.titheStatus
        )

        if(!rawServices){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        if(cleanedFilters.showHistory === false){
            return rawServices
        }

        if(cleanedFilters.showHistory === true){
            let servicesIds = new Array()

            rawServices.forEach(service =>{
                if(service.id){
                    servicesIds.push(service.id)
                }
            })

            const rawHistories = await servicesRepository.findHistoriesByServiceIds(servicesIds);

            if(!rawHistories){
                throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
            }

            return rawServices
        }

    }

    async deleteServiceById(
        id : string
    ){
        const serviceExists = await servicesRepository.findServiceById(id);

        if(!serviceExists){
            throw new AppError('Service not found', 404, "SERVICE_NOT_FOUND")
        }

        const result = await servicesRepository.deleteServiceById(id)

        if(!result){
            throw new AppError('Internal Server Error', 500, 'INTERNAL_SERVER_ERROR')
        }

        return true
    }
}

export default new ServicesService()