import {z} from 'zod'

const uniqueBudgetItemIds = (ids: string[]) => new Set(ids).size === ids.length

export const createServiceSchema = z.object({
    clientId : z.string().min(1),
    equipamentId : z.string().min(1),
    entryDate : z.coerce.date(),
    exitDate : z.coerce.date().nullable().optional(),
    status : z.string().min(1).default('pendente'),
    hoursWorked : z.coerce.number().min(0).nullable().optional(),
    description : z.string().trim().min(1),
})

export const createServiceFromBudgetSchema = z.object({
    budgetId: z.string().min(1),
    budgetItemIds: z.array(z.string().min(1))
        .min(1)
        .refine(uniqueBudgetItemIds, { message: 'Budget item ids must be unique' })
})

export const updateServiceSchema = z.object({
    clientId : z.string().min(1).optional(),
    equipamentId : z.string().min(1).optional(),
    entryDate : z.coerce.date().optional(),
    exitDate : z.coerce.date().nullable().optional(),
    hoursWorked : z.coerce.number().min(0).nullable().optional(),
    costPerHour : z.union([z.boolean(), z.null(), z.coerce.number().min(0)]).optional(),
    description : z.string().trim().min(1),
})

export const updateStatusServiceSchema = z.object({
    status : z.string().min(1),
    description : z.string().trim().min(1)
})

export const findServicesByFilters = z.object({
    id : z.string().min(1).optional(),
    clientId : z.string().min(1).optional(),
    equipamentId : z.string().min(1).optional(),
    entryDate : z.coerce.date().optional(),
    exitDate : z.coerce.date().nullable().optional(),
    status : z.string().min(1).optional(),
    hoursWorked : z.coerce.number().min(0).nullable().optional(),
    costPerHour : z.coerce.number().nullable().optional(),
    titheTransactionId : z.string().min(1).nullable().optional(),
    titheStatus : z.string().min(1).optional().nullable(),
    showHistory : z.coerce.boolean().default(false)
})

// DTOs
export type createServiceDTO = z.infer<typeof createServiceSchema>
export type createServiceFromBudgetDTO = z.infer<typeof createServiceFromBudgetSchema>
export type updateServiceDTO = z.infer<typeof updateServiceSchema>
export type updateStatusServiceDTO = z.infer<typeof updateStatusServiceSchema>
export type findServicesByFiltersDTO = z.infer<typeof findServicesByFilters>
