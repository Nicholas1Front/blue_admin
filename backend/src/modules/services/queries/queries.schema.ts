import {z} from 'zod'

export const findServiceByIdParamsSchema = z.object({
    serviceId : z.string().min(1)
})

// DTOs
export type findServiceByIdParamsDTO = z.infer<typeof findServiceByIdParamsSchema>
