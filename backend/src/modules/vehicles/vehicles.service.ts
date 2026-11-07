import { AppError } from '../../shared/errors/AppError.js'
import { removeUndefined } from '../../shared/helpers/objects/removeUndefined.js'
import { undefinedToNull } from '../../shared/helpers/objects/undefinedToNull.js'
import vehiclesRepository from './vehicles.repository.js'
import type {
    createVehicleDTO,
    updateVehicleDTO,
    updateVehicleOdometerDTO
} from './vehicles.schema.js'

class VehiclesService {
    async create(data: createVehicleDTO) {
        const cleanedData = undefinedToNull(data)
        const duplicate = await vehiclesRepository.findDuplicate(cleanedData.plate, cleanedData.renavam)

        if (duplicate) {
            throw new AppError(
                'Vehicle plate or RENAVAM is already registered',
                409,
                'VEHICLE_IDENTIFIER_ALREADY_EXISTS'
            )
        }

        return vehiclesRepository.create(data)
    }

    async update(id: string, data: updateVehicleDTO) {
        const vehicle = await vehiclesRepository.findById(id)
        if (!vehicle) throw new AppError('Vehicle not found', 404, 'VEHICLE_NOT_FOUND')

        const cleanedData = removeUndefined(data)
        const duplicate = await vehiclesRepository.findDuplicate(
            cleanedData.plate,
            cleanedData.renavam,
            id
        )

        if (duplicate) {
            throw new AppError(
                'Vehicle plate or RENAVAM is already registered',
                409,
                'VEHICLE_IDENTIFIER_ALREADY_EXISTS'
            )
        }

        return vehiclesRepository.update(id, cleanedData)
    }

    async updateOdometer(id: string, data: updateVehicleOdometerDTO) {
        const vehicle = await vehiclesRepository.findById(id)
        if (!vehicle) throw new AppError('Vehicle not found', 404, 'VEHICLE_NOT_FOUND')

        if (
            !data.isReset &&
            vehicle.currentKilometer !== null &&
            data.kilometer < vehicle.currentKilometer
        ) {
            throw new AppError(
                'A lower odometer reading must be registered as a reset',
                400,
                'ODOMETER_RESET_CONFIRMATION_REQUIRED'
            )
        }

        if (data.isReset && !data.description) {
            throw new AppError(
                'A description is required when registering an odometer reset',
                400,
                'ODOMETER_RESET_DESCRIPTION_REQUIRED'
            )
        }

        return vehiclesRepository.updateOdometer(
            id,
            data.kilometer,
            data.isReset ? data.description : undefined
        )
    }

    async delete(id: string) {
        const vehicle = await vehiclesRepository.findById(id)
        if (!vehicle) throw new AppError('Vehicle not found', 404, 'VEHICLE_NOT_FOUND')

        if (await vehiclesRepository.hasHistory(id)) {
            throw new AppError(
                'Vehicles with history records cannot be deleted',
                409,
                'VEHICLE_HAS_HISTORY'
            )
        }

        await vehiclesRepository.delete(id)
        return true
    }
}

export default new VehiclesService()
