import { AppError } from '../../shared/errors/AppError.js'

// helpers
import { undefinedToNull } from '../../shared/helpers/objects/undefinedToNull.js'
import { removeUndefined } from '../../shared/helpers/objects/removeUndefined.js'
import { verifyForUpdate } from './shared/verifyClientAndEquipament.js'
import { allowedServiceStatus } from './shared/allowedServiceStatus.js'

import servicesRepository from './services.repository.js'

import type {
    createServiceDTO,
    updateServiceDTO,
    updateStatusServiceDTO,
    findServicesByFiltersDTO
} from './services.schema.js'

class ServicesService {
    async createService(data: createServiceDTO) {
        const cleanedData = undefinedToNull(data)

        const clientExists = await servicesRepository.clientExists(cleanedData.clientId)
        if (!clientExists) {
            throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND')
        }

        const clientHasEquipament = await servicesRepository.clientHasEquipament(
            cleanedData.clientId,
            cleanedData.equipamentId
        )
        if (!clientHasEquipament) {
            throw new AppError(
                'Client does not have this equipament',
                400,
                'CLIENT_DOES_NOT_HAVE_EQUIPAMENT'
            )
        }

        if (!allowedServiceStatus.includes(cleanedData.status)) {
            throw new AppError('Invalid service status', 400, 'INVALID_SERVICE_STATUS')
        }

        if (cleanedData.costPerHour === true) {
            // Zero is a valid result when no active monthly expenses exist.
            cleanedData.costPerHour = await servicesRepository.calculateCostPerHour()
        } else {
            // The boolean input is a UI instruction, not a database value.
            cleanedData.costPerHour = null
        }

        return servicesRepository.createService(
            cleanedData.clientId,
            cleanedData.equipamentId,
            cleanedData.entryDate,
            cleanedData.exitDate,
            cleanedData.status,
            cleanedData.hoursWorked,
            cleanedData.costPerHour,
            'service_created',
            cleanedData.description
        )
    }

    async updateService(id: string, data: updateServiceDTO) {
        const serviceExists = await servicesRepository.findServiceById(id)
        if (!serviceExists.service) {
            throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND')
        }

        const cleanedData = removeUndefined(data)

        if (cleanedData.clientId !== undefined || cleanedData.equipamentId !== undefined) {
            await verifyForUpdate(serviceExists, cleanedData)
        }

        if (cleanedData.costPerHour === true) {
            cleanedData.costPerHour = await servicesRepository.calculateCostPerHour()
        } else if (cleanedData.costPerHour === false || cleanedData.costPerHour === null) {
            cleanedData.costPerHour = null
        }

        return servicesRepository.updateService(id, {
            ...cleanedData,
            eventType: 'service_updated'
        })
    }

    async updateServiceStatus(id: string, data: updateStatusServiceDTO) {
        const serviceExists = await servicesRepository.findServiceById(id)
        if (!serviceExists.service) {
            throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND')
        }

        const cleanedData = removeUndefined(data)
        if (!allowedServiceStatus.includes(cleanedData.status)) {
            throw new AppError('Invalid service status', 400, 'INVALID_SERVICE_STATUS')
        }

        return servicesRepository.updateServiceStatus(id, {
            ...cleanedData,
            eventType: 'service_status_updated'
        })
    }

    async findServicesByFilters(filters: findServicesByFiltersDTO) {
        const cleanedFilters = removeUndefined(filters)

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

        if (cleanedFilters.showHistory !== true) {
            return rawServices
        }

        const rawHistories = await servicesRepository.findHistoriesByServiceIds(
            rawServices.map(service => service.id)
        )

        const historiesByServiceId = new Map<string, typeof rawHistories>()
        for (const history of rawHistories) {
            const existing = historiesByServiceId.get(history.serviceId) ?? []
            existing.push(history)
            historiesByServiceId.set(history.serviceId, existing)
        }

        return rawServices.map(service => ({
            ...service,
            history: historiesByServiceId.get(service.id) ?? []
        }))
    }

    async deleteServiceById(id: string) {
        const serviceExists = await servicesRepository.findServiceById(id)
        if (!serviceExists.service) {
            throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND')
        }

        await servicesRepository.deleteServiceById(id)
        return true
    }
}

export default new ServicesService()
