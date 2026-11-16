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

export const findEmployeesByFiltersSchema = z.object({
    id: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1).optional(),
    document: z.string().trim().min(1).optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to find employees'
})
