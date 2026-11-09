import { AppError } from '../../../shared/errors/AppError.js'
import vehicleQueriesRepository from './queries.repository.js'
import type {
    FindVehicleHistoryByPeriodQueryDTO,
    FindVehiclesByAdvancedFiltersDTO,
    VehicleDashboardQueryDTO
} from './queries.schema.js'

class VehicleQueriesService {
    async findVehicleWithHistoryByPeriod(
        vehicleId: string,
        filters: FindVehicleHistoryByPeriodQueryDTO
    ) {
        const vehicle = await vehicleQueriesRepository.findVehicleWithHistoryByPeriod(vehicleId, filters)

        if (!vehicle) {
            throw new AppError('Vehicle not found', 404, 'VEHICLE_NOT_FOUND')
        }

        return {
            period: {
                startDate: filters.startDate,
                endDate: filters.endDate,
                dateBasis: 'eventDate'
            },
            ...vehicle
        }
    }

    async findVehicleDashboard(filters: VehicleDashboardQueryDTO) {
        const result = await vehicleQueriesRepository.findVehicleDashboard(filters)

        return {
            pagination: {
                page: filters.page,
                limit: filters.limit,
                total: result.total,
                totalPages: Math.ceil(result.total / filters.limit)
            },
            vehicles: result.vehicles.map(vehicle => {
                const { history, _count, ...vehicleData } = vehicle

                return {
                    ...vehicleData,
                    historyCount: _count.history,
                    lastEvent: history[0] ?? null
                }
            })
        }
    }

    findVehiclesByAdvancedFilters(filters: FindVehiclesByAdvancedFiltersDTO) {
        return vehicleQueriesRepository.findVehiclesByAdvancedFilters(filters)
    }
}

export default new VehicleQueriesService()
