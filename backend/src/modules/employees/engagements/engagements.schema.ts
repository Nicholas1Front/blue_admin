import { z } from 'zod'
import { allowedEngagementModalities } from '../shareds/allowedEngagementModalities.js'
import { allowedEngagementStatus } from '../shareds/allowedEngagementStatus.js'

const engagementModalitySchema = z.enum(allowedEngagementModalities)
const engagementStatusSchema = z.enum(allowedEngagementStatus)

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

export const findEngagementsByFiltersSchema = z.object({
    employeeId: z.string().uuid().optional(),
    employeeName: z.string().trim().min(1).optional(),
    status: engagementStatusSchema.optional(),
    modality: engagementModalitySchema.optional(),
    entryDateFrom: z.coerce.date().optional(),
    entryDateTo: z.coerce.date().optional(),
    exitDateFrom: z.coerce.date().optional(),
    exitDateTo: z.coerce.date().optional(),
    cursor: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20)
}).refine(data => !data.entryDateFrom || !data.entryDateTo || data.entryDateTo >= data.entryDateFrom, {
    message: 'Entry date end cannot be before start',
    path: ['entryDateTo']
}).refine(data => !data.exitDateFrom || !data.exitDateTo || data.exitDateTo >= data.exitDateFrom, {
    message: 'Exit date end cannot be before start',
    path: ['exitDateTo']
})

export type findEngagementsByFiltersDTO = z.infer<typeof findEngagementsByFiltersSchema>
