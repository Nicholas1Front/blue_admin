import { z } from 'zod'
import { engagementModalitySchema, engagementStatusSchema } from '../employees.schema.js'

const optionalDate = z.coerce.date().nullable().optional()
const optionalAmount = z.coerce.number().min(0).nullable().optional()

export const createEngagementSchema = z.object({
    entryDate: optionalDate,
    exitDate: optionalDate,
    status: engagementStatusSchema,
    currentSalary: optionalAmount,
    hourlyRate: optionalAmount,
    modality: engagementModalitySchema,
    observations: z.string().trim().min(1).nullable().optional()
})

export const updateEngagementSchema = z.object({
    entryDate: optionalDate,
    exitDate: optionalDate,
    status: engagementStatusSchema.optional(),
    currentSalary: optionalAmount,
    hourlyRate: optionalAmount,
    modality: engagementModalitySchema.optional(),
    observations: z.string().trim().min(1).nullable().optional(),
    effectiveDate: z.coerce.date().optional()
}).refine(data => Object.keys(data).some(field => field !== 'effectiveDate'), {
    message: 'At least one engagement field must be provided to update'
})

export type createEngagementDTO = z.infer<typeof createEngagementSchema>
export type updateEngagementDTO = z.infer<typeof updateEngagementSchema>
