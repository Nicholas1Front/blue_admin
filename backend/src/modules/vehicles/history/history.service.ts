import { AppError } from '../../../shared/errors/AppError.js'
import vehicleHistoryRepository from './history.repository.js'
import type {
    createVehicleHistoryDTO,
    updateVehicleHistoryDTO
} from './history.schema.js'

class VehicleHistoryService {
    async create(vehicleId: string, data: createVehicleHistoryDTO) {
        const vehicle = await vehicleHistoryRepository.vehicleExists(vehicleId)
        if (!vehicle) throw new AppError('Vehicle not found', 404, 'VEHICLE_NOT_FOUND')

        if (data.eventType === 'odometer_reset') {
            throw new AppError(
                'Odometer reset events must be created through the odometer update operation',
                400,
                'ODOMETER_RESET_REQUIRES_ODOMETER_UPDATE'
            )
        }

        return vehicleHistoryRepository.create(vehicleId, data)
    }

    async update(id: string, data: updateVehicleHistoryDTO) {
        const history = await vehicleHistoryRepository.findById(id)
        if (!history) throw new AppError('Vehicle history record not found', 404, 'VEHICLE_HISTORY_NOT_FOUND')

        if (history.eventType === 'odometer_reset' || data.eventType === 'odometer_reset') {
            throw new AppError(
                'Odometer reset history records cannot be changed',
                400,
                'ODOMETER_RESET_HISTORY_IMMUTABLE'
            )
        }

        return vehicleHistoryRepository.update(id, data)
    }

    async delete(id: string) {
        const history = await vehicleHistoryRepository.findById(id)
        if (!history) throw new AppError('Vehicle history record not found', 404, 'VEHICLE_HISTORY_NOT_FOUND')

        if (history.eventType === 'odometer_reset') {
            throw new AppError(
                'Odometer reset history records cannot be deleted',
                400,
                'ODOMETER_RESET_HISTORY_IMMUTABLE'
            )
        }

        await vehicleHistoryRepository.delete(id)
        return true
    }
}

export default new VehicleHistoryService()
