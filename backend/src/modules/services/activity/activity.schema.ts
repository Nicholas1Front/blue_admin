import {z} from 'zod'

export const addActivitySchema = z.object({
    title : z.string().trim().min(1),
    description : z.string().nullable().optional(),
    startAt : z.coerce.date().nullable().optional(),
    endAt : z.coerce.date().nullable().optional(),
    status : z.string().default('concluida')
})

export const updateActivitySchema = z.object({
    title : z.string().trim().min(1).optional(),
    description : z.string().nullable().optional(),
    startAt : z.coerce.date().nullable().optional(),
    endAt : z.coerce.date().nullable().optional(),
    status : z.string().optional()
}).refine(
    data => Object.keys(data).length > 0,
    {
        message : 'At least one field must be provided to update activity'
    }
)

export const findActivitiesByFiltersSchema = z.object({
    id : z.string().min(1).optional(),
    serviceId : z.string().min(1).optional(),
    title : z.string().min(1).optional(),
    description : z.string().nullable().optional(),
    startAt : z.coerce.date().nullable().optional(),
    endAt : z.coerce.date().nullable().optional(),
    status : z.string().optional()
})

// DTOs
export type addActivityDTO = z.infer<typeof addActivitySchema>
export type updateActivityDTO = z.infer<typeof updateActivitySchema>
export type findActivitiesByFiltersDTO = z.infer<typeof findActivitiesByFiltersSchema>
