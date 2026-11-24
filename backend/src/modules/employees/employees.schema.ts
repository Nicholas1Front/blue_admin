import { z } from 'zod'

export const createEmployeeSchema = z.object({
    name: z.string().trim().min(1),
    document: z.string().trim().min(1).nullable().optional(),
    observations: z.string().trim().min(1).nullable().optional()
})

export const updateEmployeeSchema = z.object({
    name: z.string().trim().min(1).optional(),
    document: z.string().trim().min(1).nullable().optional(),
    observations: z.string().trim().min(1).nullable().optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update employee'
})

export type createEmployeeDTO = z.infer<typeof createEmployeeSchema>
export type updateEmployeeDTO = z.infer<typeof updateEmployeeSchema>

export const findEmployeesByFiltersSchema = z.object({
    name: z.string().trim().min(1).optional(),
    document: z.string().trim().min(1).optional(),
    cursor: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20)
})

export type findEmployeesByFiltersDTO = z.infer<typeof findEmployeesByFiltersSchema>
