import { z } from 'zod'

export const createEmployeeSchema = z.object({
    name: z.string().trim().min(1),
    document: z.string().trim().min(1).nullable().optional(),
    address: z.string().trim().min(1).nullable().optional(),
    birthDate: z.coerce.date().nullable().optional(),
    observations: z.string().trim().min(1).nullable().optional()
})

export const updateEmployeeSchema = z.object({
    name: z.string().trim().min(1).optional(),
    document: z.string().trim().min(1).nullable().optional(),
    address: z.string().trim().min(1).nullable().optional(),
    birthDate: z.coerce.date().nullable().optional(),
    observations: z.string().trim().min(1).nullable().optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update employee'
})

export type createEmployeeDTO = z.infer<typeof createEmployeeSchema>
export type updateEmployeeDTO = z.infer<typeof updateEmployeeSchema>

export const findEmployeesByFiltersSchema = z.object({
    name: z.string().trim().min(1).optional(),
    document: z.string().trim().min(1).optional(),
    address: z.string().trim().min(1).optional(),
    birthDateFrom: z.coerce.date().optional(),
    birthDateTo: z.coerce.date().optional(),
    cursor: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20)
}).refine(data => !data.birthDateFrom || !data.birthDateTo || data.birthDateTo >= data.birthDateFrom, {
    message: 'Birth date end cannot be before start',
    path: ['birthDateTo']
})

export type findEmployeesByFiltersDTO = z.infer<typeof findEmployeesByFiltersSchema>
