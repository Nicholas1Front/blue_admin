import { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../../shared/database/prisma.js'
import type { createVehicleDTO } from './vehicles.schema.js'

class VehiclesRepository {
    create(data: createVehicleDTO) {
        return prisma.vehicle.create({
            data: {
                title: data.title,
                plate: data.plate ?? null,
                renavam: data.renavam ?? null,
                crlv: data.crlv ?? null,
                crv: data.crv ?? null,
                currentKilometer: data.currentKilometer ?? null,
                observations: data.observations ?? null
            }
        })
    }

    findById(id: string) {
        return prisma.vehicle.findUnique({ where: { id } })
    }

    findDuplicate(plate?: string | null, renavam?: string | null, exceptId?: string) {
        const identifiers: Prisma.VehicleWhereInput[] = []
        if (plate) identifiers.push({ plate })
        if (renavam) identifiers.push({ renavam })
        if (identifiers.length === 0) return null

        return prisma.vehicle.findFirst({
            where: {
                ...(exceptId !== undefined && { id: { not: exceptId } }),
                OR: identifiers
            },
            select: { id: true }
        })
    }

    update(id: string, data: Prisma.VehicleUpdateInput) {
        return prisma.vehicle.update({
            where: { id },
            data
        })
    }

    updateOdometer(id: string, kilometer: number, resetDescription?: string) {
        return prisma.$transaction(async tx => {
            const vehicle = await tx.vehicle.update({
                where: { id },
                data: { currentKilometer: kilometer }
            })

            if (resetDescription !== undefined) {
                await tx.vehicleHistory.create({
                    data: {
                        vehicleId: id,
                        eventType: 'odometer_reset',
                        description: resetDescription,
                        kilometerSnapshot: kilometer
                    }
                })
            }

            return vehicle
        })
    }

    delete(id: string) {
        return prisma.vehicle.delete({ where: { id } })
    }
}

export default new VehiclesRepository()
