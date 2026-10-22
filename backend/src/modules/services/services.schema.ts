import {z} from 'zod'

export const createServiceSchema = z.object({
    clientId : z.string().min(1),
    equipamentId : z.string().min(1),
    entryDate : z.coerce.date(),
    exitDate : z.coerce.date().nullable().optional(),
    status : z.string().min(1).default('pendente'),
    hoursWorked : z.coerce.number().nullable().optional(),
    costPerHour : z.coerce.boolean().nullable().optional(),
    eventType : z.string().min(1).default('service_created'),
    description : z.string().min(1),
})

export const updateServiceSchema = z.object({
    clientId : z.string().min(1).optional(),
    equipamentId : z.string().min(1).optional(),
    entryDate : z.coerce.date().optional(),
    exitDate : z.coerce.date().nullable().optional(),
    hoursWorked : z.coerce.number().nullable().optional(),
    costPerHour : z.coerce.boolean().nullable().optional(),
    eventType : z.string().min(1).default('service_created'),
    description : z.string().min(1),
})

export const updateStatusServiceSchema = z.object({
    status : z.string().min(1),
    eventType : z.string().min(1).default('service_updated'),
    description : z.string().min(1)
})

export const findServicesByFilters = z.object({
    id : z.string().min(1).optional(),
    clientId : z.string().min(1).optional(),
    equipamentId : z.string().min(1).optional(),
    entryDate : z.coerce.date().optional(),
    exitDate : z.coerce.date().nullable().optional(),
    status : z.string().min(1).optional(),
    hoursWorked : z.coerce.number().nullable().optional(),
    costPerHour : z.coerce.boolean().nullable().optional(),
    titheTransactionId : z.string().min(1).nullable().optional(),
    titheStatus : z.string().min(1).optional().nullable()
})

//DTOs

export type createServiceDTO = z.infer<typeof createServiceSchema>
export type updateServiceDTO = z.infer<typeof updateServiceSchema>
export type updateStatusServiceDTO = z.infer<typeof updateStatusServiceSchema>
export type findServicesByFiltersDTO = z.infer<typeof findServicesByFilters>