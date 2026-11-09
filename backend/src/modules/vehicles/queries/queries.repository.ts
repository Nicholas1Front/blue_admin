import type { Prisma } from '../../../generated/prisma/client.js'
import { prisma } from '../../../shared/database/prisma.js'
import type {
    FindVehicleHistoryByPeriodQueryDTO,
    FindVehiclesByAdvancedFiltersDTO,
    VehicleDashboardQueryDTO
} from './queries.schema.js'

const vehicleSummarySelect = {
    id: true,
    title: true,
    plate: true,
    renavam: true,
    currentKilometer: true,
    createdAt: true,
    updatedAt: true,
    _count: {
        select: {
            history: true
        }
    }
} satisfies Prisma.VehicleSelect

const toDateRange = (from?: string, to?: string) => {
    if (from === undefined && to === undefined) return undefined

    const range: { gte?: Date; lt?: Date } = {}
    if (from !== undefined) range.gte = new Date(`${from}T00:00:00.000Z`)
    if (to !== undefined) {
        const endExclusive = new Date(`${to}T00:00:00.000Z`)
        endExclusive.setUTCDate(endExclusive.getUTCDate() + 1)
        range.lt = endExclusive
    }

    return range
}

const contains = (value: string) => ({
    contains: value,
    mode: 'insensitive' as const
})

class VehicleQueriesRepository {
    findVehicleWithHistoryByPeriod(vehicleId: string, filters: FindVehicleHistoryByPeriodQueryDTO) {
        const startDate = new Date(`${filters.startDate}T00:00:00.000Z`)
        const endDateExclusive = new Date(`${filters.endDate}T00:00:00.000Z`)
        endDateExclusive.setUTCDate(endDateExclusive.getUTCDate() + 1)

        return prisma.vehicle.findUnique({
            where: { id: vehicleId },
            include: {
                history: {
                    where: {
                        eventDate: {
                            gte: startDate,
                            lt: endDateExclusive
                        }
                    },
                    orderBy: [
                        { eventDate: 'desc' },
                        { createdAt: 'desc' },
                        { id: 'desc' }
                    ]
                }
            }
        })
    }

    async findVehicleDashboard(filters: VehicleDashboardQueryDTO) {
        const [total, vehicles] = await Promise.all([
            prisma.vehicle.count(),
            prisma.vehicle.findMany({
                select: {
                    ...vehicleSummarySelect,
                    history: {
                        take: 1,
                        orderBy: [
                            { createdAt: 'desc' },
                            { id: 'desc' }
                        ],
                        select: {
                            id: true,
                            eventType: true,
                            description: true,
                            kilometerSnapshot: true,
                            eventDate: true,
                            createdAt: true
                        }
                    }
                },
                orderBy: [
                    { updatedAt: 'desc' },
                    { createdAt: 'desc' },
                    { id: 'desc' }
                ],
                skip: (filters.page - 1) * filters.limit,
                take: filters.limit
            })
        ])

        return { total, vehicles }
    }

    async findVehiclesByAdvancedFilters(filters: FindVehiclesByAdvancedFiltersDTO) {
        const andFilters: Prisma.VehicleWhereInput[] = []
        const vehicleCreatedAt = toDateRange(filters.vehicleCreatedAtFrom, filters.vehicleCreatedAtTo)
        const vehicleUpdatedAt = toDateRange(filters.vehicleUpdatedAtFrom, filters.vehicleUpdatedAtTo)
        const historyDate = toDateRange(filters.historyDateFrom, filters.historyDateTo)

        if (filters.vehicleId !== undefined) andFilters.push({ id: contains(filters.vehicleId) })
        if (filters.title !== undefined) andFilters.push({ title: contains(filters.title) })
        if (filters.plate !== undefined) andFilters.push({ plate: contains(filters.plate) })
        if (filters.renavam !== undefined) andFilters.push({ renavam: contains(filters.renavam) })
        if (filters.crlv !== undefined) andFilters.push({ crlv: contains(filters.crlv) })
        if (filters.crv !== undefined) andFilters.push({ crv: contains(filters.crv) })
        if (filters.observations !== undefined) andFilters.push({ observations: contains(filters.observations) })

        if (filters.currentKilometerMin !== undefined || filters.currentKilometerMax !== undefined) {
            andFilters.push({
                currentKilometer: {
                    ...(filters.currentKilometerMin !== undefined && { gte: filters.currentKilometerMin }),
                    ...(filters.currentKilometerMax !== undefined && { lte: filters.currentKilometerMax })
                }
            })
        }

        if (vehicleCreatedAt !== undefined) andFilters.push({ createdAt: vehicleCreatedAt })
        if (vehicleUpdatedAt !== undefined) andFilters.push({ updatedAt: vehicleUpdatedAt })

        const historyWhere: Prisma.VehicleHistoryWhereInput = {
            ...(filters.historyId !== undefined && { id: contains(filters.historyId) }),
            ...(filters.historyEventType !== undefined && { eventType: contains(filters.historyEventType) }),
            ...(filters.historyDescription !== undefined && { description: contains(filters.historyDescription) }),
            ...((filters.historyKilometerMin !== undefined || filters.historyKilometerMax !== undefined) && {
                kilometerSnapshot: {
                    ...(filters.historyKilometerMin !== undefined && { gte: filters.historyKilometerMin }),
                    ...(filters.historyKilometerMax !== undefined && { lte: filters.historyKilometerMax })
                }
            }),
            ...(historyDate !== undefined && { eventDate: historyDate })
        }

        const hasHistoryFilters = Object.keys(historyWhere).length > 0
        if (hasHistoryFilters) andFilters.push({ history: { some: historyWhere } })

        if (filters.search !== undefined) {
            andFilters.push({
                OR: [
                    { id: contains(filters.search) },
                    { title: contains(filters.search) },
                    { plate: contains(filters.search) },
                    { renavam: contains(filters.search) },
                    { crlv: contains(filters.search) },
                    { crv: contains(filters.search) },
                    { observations: contains(filters.search) },
                    {
                        history: {
                            some: {
                                OR: [
                                    { eventType: contains(filters.search) },
                                    { description: contains(filters.search) }
                                ]
                            }
                        }
                    }
                ]
            })
        }

        const where: Prisma.VehicleWhereInput = andFilters.length > 0 ? { AND: andFilters } : {}
        const matchingHistoryWhere: Prisma.VehicleHistoryWhereInput = {
            ...historyWhere,
            ...(filters.search !== undefined && {
                OR: [
                    { eventType: contains(filters.search) },
                    { description: contains(filters.search) }
                ]
            })
        }

        const [total, vehicles] = await Promise.all([
            prisma.vehicle.count({ where }),
            prisma.vehicle.findMany({
                where,
                select: {
                    ...vehicleSummarySelect,
                    history: {
                        where: Object.keys(matchingHistoryWhere).length > 0
                            ? matchingHistoryWhere
                            : undefined,
                        take: 5,
                        orderBy: [
                            { eventDate: 'desc' },
                            { createdAt: 'desc' },
                            { id: 'desc' }
                        ],
                        select: {
                            id: true,
                            eventType: true,
                            description: true,
                            kilometerSnapshot: true,
                            eventDate: true,
                            createdAt: true
                        }
                    }
                },
                orderBy: [
                    { updatedAt: 'desc' },
                    { createdAt: 'desc' },
                    { id: 'desc' }
                ],
                skip: (filters.page - 1) * filters.limit,
                take: filters.limit
            })
        ])

        return {
            vehicles,
            page: filters.page,
            limit: filters.limit,
            total,
            totalPages: Math.ceil(total / filters.limit)
        }
    }
}

export default new VehicleQueriesRepository()
