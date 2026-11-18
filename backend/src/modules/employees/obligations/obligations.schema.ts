import { z } from 'zod'
import { allowedObligationTypes } from '../shareds/allowedObligationTypes.js'
import { allowedObligationStatus } from '../shareds/allowedObligationStatus.js'

const obligationTypeSchema = z.enum(allowedObligationTypes)
const obligationStatusSchema = z.enum(allowedObligationStatus)
const optionalDate = z.coerce.date().nullable().optional()
const amountSchema = z.coerce.number().finite().positive()
const monthSchema = z.coerce.number().int().min(1).max(12)
const yearSchema = z.coerce.number().int().min(1900).max(2200)
const queryBoolean = z.enum(['true', 'false']).default('true').transform(value => value === 'true')

export const createObligationSchema = z.object({
    type: obligationTypeSchema,
    title: z.string().trim().min(1),
    description: z.string().trim().min(1).nullable().optional(),
    referenceStart: optionalDate,
    referenceEnd: optionalDate,
    dueDate: optionalDate,
    originalValue: amountSchema,
    finalValue: amountSchema,
    status: obligationStatusSchema,
    observations: z.string().trim().min(1).nullable().optional()
}).refine(data => {
    if (!data.referenceStart || !data.referenceEnd) return true
    return data.referenceEnd >= data.referenceStart
}, {
    message: 'Reference end cannot be before reference start',
    path: ['referenceEnd']
})

export const updateObligationSchema = z.object({
    type: obligationTypeSchema.optional(),
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).nullable().optional(),
    referenceStart: optionalDate,
    referenceEnd: optionalDate,
    dueDate: optionalDate,
    originalValue: amountSchema.optional(),
    finalValue: amountSchema.optional(),
    status: obligationStatusSchema.optional(),
    observations: z.string().trim().min(1).nullable().optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update obligation'
}).refine(data => {
    if (data.referenceStart === undefined || data.referenceEnd === undefined) return true
    if (!data.referenceStart || !data.referenceEnd) return true
    return data.referenceEnd >= data.referenceStart
}, {
    message: 'Reference end cannot be before reference start',
    path: ['referenceEnd']
})

export type createObligationDTO = z.infer<typeof createObligationSchema>
export type updateObligationDTO = z.infer<typeof updateObligationSchema>

export const createObligationsBatchSchema = z.object({
    obligations: z.array(createObligationSchema).min(1).max(100)
})

export const analyzeObligationsQuerySchema = z.object({
    startMonth: monthSchema,
    startYear: yearSchema,
    endMonth: monthSchema,
    endYear: yearSchema,
    calculateSalary: queryBoolean,
    calculateVacation: queryBoolean,
    calculateThirteenthSalary: queryBoolean
}).superRefine((data, context) => {
    const start = data.startYear * 12 + data.startMonth
    const end = data.endYear * 12 + data.endMonth

    if (start > end) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Start month cannot be after end month',
            path: ['endMonth']
        })
        return
    }

    if (end - start >= 480) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'The analysis period cannot exceed 40 years',
            path: ['endYear']
        })
    }
})

export type createObligationsBatchDTO = z.infer<typeof createObligationsBatchSchema>
export type analyzeObligationsQueryDTO = z.infer<typeof analyzeObligationsQuerySchema>
