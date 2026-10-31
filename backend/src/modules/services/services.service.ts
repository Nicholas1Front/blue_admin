import {AppError} from '../../shared/errors/AppError.js'

//helpers
import { undefinedToNull } from '../../shared/helpers/objects/undefinedToNull.js'
import { removeUndefined } from './../../shared/helpers/objects/removeUndefined.js';
import {verifyForUpdate} from './shared/verifyClientAndEquipament.js'
import {allowedServiceStatus} from './shared/allowedServiceStatus.js'
import {normalizeHistoryRecords} from './shared/historyLocalization.js'

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
            throw new AppError('Client does not have this equipament', 400, 'CLIENT_DOES_NOT_HAVE_EQUIPAMENT')
        }

        if(!allowedServiceStatus.includes(cleanedData.status)){
            throw new AppError('Invalid service status', 400, 'INVALID_SERVICE_STATUS')
        }

        if(cleanedData.exitDate !== null && cleanedData.exitDate < cleanedData.entryDate){
            throw new AppError('Exit date cannot be before entry date', 400, 'INVALID_SERVICE_PERIOD')
        }

        const service = await servicesRepository.createService(
            cleanedData.clientId,
            cleanedData.equipamentId,
            cleanedData.entryDate,
            cleanedData.exitDate,
            cleanedData.status,
            cleanedData.hoursWorked,
            null,
            'servico_criado',
            cleanedData.description
        )

        return service
    }

    async updateService(
        id : string,
        data : updateServiceDTO
    ){
        const serviceExists = await servicesRepository.findServiceById(id)

        if(!serviceExists.service){
            throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND')
        }

        const cleanedData = removeUndefined(data)

        if(cleanedData.clientId !== undefined || cleanedData.equipamentId !== undefined){
            await verifyForUpdate(
                serviceExists,
                cleanedData
            )
        }

        const effectiveEntryDate = cleanedData.entryDate ?? serviceExists.service.entryDate
        const effectiveExitDate = cleanedData.exitDate !== undefined
            ? cleanedData.exitDate
            : serviceExists.service.exitDate

        if(effectiveExitDate !== null && effectiveExitDate < effectiveEntryDate){
            throw new AppError('Exit date cannot be before entry date', 400, 'INVALID_SERVICE_PERIOD')
        }

        if(cleanedData.costPerHour !== undefined && cleanedData.costPerHour === true){
            cleanedData.costPerHour = await servicesRepository.calculateCostPerHour()
        }

        if(cleanedData.costPerHour !== undefined && (cleanedData.costPerHour === false || cleanedData.costPerHour === null)){
            cleanedData.costPerHour = null
        }

        const updatedService = await servicesRepository.updateService(
            id,
            {
                ...cleanedData,
                eventType : 'servico_atualizado'
            }
        )

        return updatedService
    }

    async updateServiceStatus(
        id : string,
        data : updateStatusServiceDTO
    ){
        const serviceExists = await servicesRepository.findServiceById(id)

        if(!serviceExists.service){
            throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND')
        }

        const cleanedData = removeUndefined(data);

        if(!allowedServiceStatus.includes(cleanedData.status)){
            throw new AppError('Invalid service status', 400, 'INVALID_SERVICE_STATUS')
        }

        const updatedService = await servicesRepository.updateServiceStatus(
            id,
            {
                ...cleanedData,
                eventType : 'status_servico_atualizado'
            }
        )

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

        if(cleanedFilters.showHistory !== true){
            return rawServices
        }

        const rawHistories = await servicesRepository.findHistoriesByServiceIds(
            rawServices.map(service => service.id)
        )

        return rawServices.map(service => ({
            ...service,
            history : normalizeHistoryRecords(rawHistories.filter(history => history.serviceId === service.id))
        }))
    }

    async deleteServiceById(
        id : string
    ){
        const serviceExists = await servicesRepository.findServiceById(id);

        if(!serviceExists.service){
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
