import { z } from 'zod'

const dateRange = (fromKey: string, toKey: string) => (filters: Record<string, unknown>) => {
    const from = filters[fromKey]
    const to = filters[toKey]
    return typeof from !== 'string' || typeof to !== 'string' || from <= to
}

const numberRange = (minKey: string, maxKey: string) => (filters: Record<string, unknown>) => {
    const min = filters[minKey]
    const max = filters[maxKey]
    return typeof min !== 'number' || typeof max !== 'number' || min <= max
}

export const findVehicleHistoryByPeriodParamsSchema = z.object({
    vehicleId: z.string().trim().min(1)
})

export const findVehicleHistoryByPeriodQuerySchema = z.object({
    startDate: z.iso.date(),
    endDate: z.iso.date()
}).refine(filters => filters.startDate <= filters.endDate, {
    message: 'The start date must be before or equal to the end date',
    path: ['endDate']
})

export const vehicleDashboardQuerySchema = z.object({
    page: z.coerce.number().int().min(1).max(1000000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10)
})

export const findVehiclesByAdvancedFiltersSchema = z.object({
    search: z.string().trim().min(1).optional(),

    vehicleId: z.string().trim().min(1).optional(),
    title: z.string().trim().min(1).optional(),
    plate: z.string().trim().min(1).optional(),
    renavam: z.string().trim().min(1).optional(),
    crlv: z.string().trim().min(1).optional(),
    crv: z.string().trim().min(1).optional(),
    observations: z.string().trim().min(1).optional(),
    currentKilometerMin: z.coerce.number().int().min(0).optional(),
    currentKilometerMax: z.coerce.number().int().min(0).optional(),
    vehicleCreatedAtFrom: z.iso.date().optional(),
    vehicleCreatedAtTo: z.iso.date().optional(),
    vehicleUpdatedAtFrom: z.iso.date().optional(),
    vehicleUpdatedAtTo: z.iso.date().optional(),

    historyId: z.string().trim().min(1).optional(),
    historyEventType: z.string().trim().min(1).optional(),
    historyDescription: z.string().trim().min(1).optional(),
    historyKilometerMin: z.coerce.number().int().min(0).optional(),
    historyKilometerMax: z.coerce.number().int().min(0).optional(),
    historyDateFrom: z.iso.date().optional(),
    historyDateTo: z.iso.date().optional(),

    page: z.coerce.number().int().min(1).max(1000000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
}).refine(filters => Object.keys(filters).some(key => !['page', 'limit'].includes(key)), {
    message: 'At least one vehicle or history filter must be provided'
}).refine(numberRange('currentKilometerMin', 'currentKilometerMax'), {
    message: 'The minimum odometer reading must be less than or equal to the maximum',
    path: ['currentKilometerMax']
}).refine(numberRange('historyKilometerMin', 'historyKilometerMax'), {
    message: 'The minimum history odometer reading must be less than or equal to the maximum',
    path: ['historyKilometerMax']
}).refine(dateRange('vehicleCreatedAtFrom', 'vehicleCreatedAtTo'), {
    message: 'The start date must be before or equal to the end date',
    path: ['vehicleCreatedAtTo']
}).refine(dateRange('vehicleUpdatedAtFrom', 'vehicleUpdatedAtTo'), {
    message: 'The start date must be before or equal to the end date',
    path: ['vehicleUpdatedAtTo']
}).refine(dateRange('historyDateFrom', 'historyDateTo'), {
    message: 'The start date must be before or equal to the end date',
    path: ['historyDateTo']
})

export type FindVehicleHistoryByPeriodParamsDTO = z.infer<typeof findVehicleHistoryByPeriodParamsSchema>
export type FindVehicleHistoryByPeriodQueryDTO = z.infer<typeof findVehicleHistoryByPeriodQuerySchema>
export type VehicleDashboardQueryDTO = z.infer<typeof vehicleDashboardQuerySchema>
export type FindVehiclesByAdvancedFiltersDTO = z.infer<typeof findVehiclesByAdvancedFiltersSchema>
