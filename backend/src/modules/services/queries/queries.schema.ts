import {z} from 'zod'

const dateRange = (fromKey : string, toKey : string) => (
    filters : Record<string, unknown>
) => {
    const from = filters[fromKey]
    const to = filters[toKey]

    return typeof from !== 'string' || typeof to !== 'string' || from <= to
}

export const findServiceByIdParamsSchema = z.object({
    serviceId : z.string().min(1)
})

export const serviceDashboardQuerySchema = z.object({
    year : z.coerce.number().int().min(1).max(9999),
    month : z.coerce.number().int().min(1).max(12).optional(),
    page : z.coerce.number().int().min(1).max(1000000).default(1),
    limit : z.coerce.number().int().min(1).max(100).default(5)
})

export const findServicesByFiltersQuerySchema = z.object({
    search : z.string().trim().min(1).optional(),

    serviceId : z.string().trim().min(1).optional(),
    clientId : z.string().trim().min(1).optional(),
    clientName : z.string().trim().min(1).optional(),
    clientDocument : z.string().trim().min(1).optional(),
    equipamentId : z.string().trim().min(1).optional(),
    equipamentSearch : z.string().trim().min(1).optional(),
    serviceStatus : z.string().trim().min(1).optional(),
    entryDateFrom : z.iso.date().optional(),
    entryDateTo : z.iso.date().optional(),
    exitDateFrom : z.iso.date().optional(),
    exitDateTo : z.iso.date().optional(),
    exitDateIsNull : z.enum(['true', 'false']).transform(value => value === 'true').optional(),
    hoursWorkedMin : z.coerce.number().min(0).optional(),
    hoursWorkedMax : z.coerce.number().min(0).optional(),
    titheStatus : z.string().trim().min(1).optional(),
    titheTransactionId : z.string().trim().min(1).optional(),

    activityId : z.string().trim().min(1).optional(),
    activityTitle : z.string().trim().min(1).optional(),
    activityDescription : z.string().trim().min(1).optional(),
    activityStatus : z.string().trim().min(1).optional(),
    activityStartFrom : z.iso.date().optional(),
    activityStartTo : z.iso.date().optional(),
    activityEndFrom : z.iso.date().optional(),
    activityEndTo : z.iso.date().optional(),

    transactionType : z.enum(['income', 'expense']).optional(),
    transactionCategoryId : z.string().trim().min(1).optional(),
    transactionCategoryName : z.string().trim().min(1).optional(),
    transactionDescription : z.string().trim().min(1).optional(),
    transactionValueMin : z.coerce.number().min(0).optional(),
    transactionValueMax : z.coerce.number().min(0).optional(),
    transactionReferenceDateFrom : z.iso.date().optional(),
    transactionReferenceDateTo : z.iso.date().optional(),

    historyId : z.string().trim().min(1).optional(),
    historyEventType : z.string().trim().min(1).optional(),
    historyDescription : z.string().trim().min(1).optional(),
    historyDateFrom : z.iso.date().optional(),
    historyDateTo : z.iso.date().optional(),

    page : z.coerce.number().int().min(1).max(1000000).default(1),
    limit : z.coerce.number().int().min(1).max(100).default(20)
}).refine(dateRange('entryDateFrom', 'entryDateTo'), {
    message : 'A data inicial deve ser anterior ou igual à data final',
    path : ['entryDateTo']
}).refine(dateRange('exitDateFrom', 'exitDateTo'), {
    message : 'A data inicial deve ser anterior ou igual à data final',
    path : ['exitDateTo']
}).refine(dateRange('activityStartFrom', 'activityStartTo'), {
    message : 'A data inicial deve ser anterior ou igual à data final',
    path : ['activityStartTo']
}).refine(dateRange('activityEndFrom', 'activityEndTo'), {
    message : 'A data inicial deve ser anterior ou igual à data final',
    path : ['activityEndTo']
}).refine(dateRange('transactionReferenceDateFrom', 'transactionReferenceDateTo'), {
    message : 'A data inicial deve ser anterior ou igual à data final',
    path : ['transactionReferenceDateTo']
}).refine(dateRange('historyDateFrom', 'historyDateTo'), {
    message : 'A data inicial deve ser anterior ou igual à data final',
    path : ['historyDateTo']
}).refine(
    filters => filters.hoursWorkedMin === undefined ||
        filters.hoursWorkedMax === undefined ||
        filters.hoursWorkedMin <= filters.hoursWorkedMax,
    {
        message : 'O valor mínimo deve ser menor ou igual ao máximo',
        path : ['hoursWorkedMax']
    }
).refine(
    filters => filters.transactionValueMin === undefined ||
        filters.transactionValueMax === undefined ||
        filters.transactionValueMin <= filters.transactionValueMax,
    {
        message : 'O valor mínimo deve ser menor ou igual ao máximo',
        path : ['transactionValueMax']
    }
)

export const serviceMetricsQuerySchema = z.object({
    year : z.coerce.number().int().min(1).max(9999),
    month : z.coerce.number().int().min(1).max(12).optional()
})

export const serviceCalendarQuerySchema = z.object({
    startDate : z.iso.date(),
    endDate : z.iso.date()
}).refine(filters => filters.startDate <= filters.endDate, {
    message : 'A data inicial deve ser anterior ou igual à data final',
    path : ['endDate']
}).refine(filters => {
    const start = new Date(`${filters.startDate}T00:00:00.000Z`)
    const end = new Date(`${filters.endDate}T00:00:00.000Z`)
    return (end.getTime() - start.getTime()) / 86400000 <= 62
}, {
    message : 'O calendário permite consultar no máximo 63 dias por requisição',
    path : ['endDate']
})

// DTOs
export type findServiceByIdParamsDTO = z.infer<typeof findServiceByIdParamsSchema>
export type ServiceDashboardQueryDTO = z.infer<typeof serviceDashboardQuerySchema>
export type ServiceMetricsQueryDTO = z.infer<typeof serviceMetricsQuerySchema>
export type ServiceCalendarQueryDTO = z.infer<typeof serviceCalendarQuerySchema>
export type FindServicesByFiltersQueryDTO = z.infer<typeof findServicesByFiltersQuerySchema>
