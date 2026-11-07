import { Prisma } from '../../../generated/prisma/client.js'
import { prisma } from '../../../shared/database/prisma.js'
import type {
    createVehicleHistoryDTO,
} from './history.schema.js'

class VehicleHistoryRepository {
    vehicleExists(vehicleId: string) {
        return prisma.vehicle.findUnique({
            where: { id: vehicleId },
            select: { id: true }
        })
    }

    create(vehicleId: string, data: createVehicleHistoryDTO) {
        return prisma.vehicleHistory.create({
            data: {
                vehicleId,
                eventType: data.eventType,
                description: data.description,
                kilometerSnapshot: data.kilometerSnapshot ?? null,
                eventDate: data.eventDate ?? new Date()
            }
        })
    }

    findById(id: string) {
        return prisma.vehicleHistory.findUnique({ where: { id } })
    }

    update(id: string, data: Prisma.VehicleHistoryUpdateInput) {
        return prisma.vehicleHistory.update({
            where: { id },
            data
        })
    }

    delete(id: string) {
        return prisma.vehicleHistory.delete({ where: { id } })
    }
}

export default new VehicleHistoryRepository()
