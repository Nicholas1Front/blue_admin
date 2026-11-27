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
            code: 'custom',
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

export const findObligationsByFiltersSchema = z.object({
    employeeId: z.string().uuid().optional(),
    employeeName: z.string().trim().min(1).optional(),
    engagementId: z.string().uuid().optional(),
    type: obligationTypeSchema.optional(),
    status: obligationStatusSchema.optional(),
    title: z.string().trim().min(1).optional(),
    valueFrom: z.coerce.number().finite().min(0).optional(),
    valueTo: z.coerce.number().finite().min(0).optional(),
    dueDateFrom: z.coerce.date().optional(),
    dueDateTo: z.coerce.date().optional(),
    referenceStartFrom: z.coerce.date().optional(),
    referenceStartTo: z.coerce.date().optional(),
    referenceEndFrom: z.coerce.date().optional(),
    referenceEndTo: z.coerce.date().optional(),
    cursor: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20)
}).refine(data => data.valueFrom === undefined || data.valueTo === undefined || data.valueTo >= data.valueFrom, {
    message: 'Maximum value cannot be below minimum value',
    path: ['valueTo']
}).refine(data => !data.dueDateFrom || !data.dueDateTo || data.dueDateTo >= data.dueDateFrom, {
    message: 'Due date end cannot be before start',
    path: ['dueDateTo']
}).refine(data => !data.referenceStartFrom || !data.referenceStartTo || data.referenceStartTo >= data.referenceStartFrom, {
    message: 'Reference start end cannot be before start',
    path: ['referenceStartTo']
}).refine(data => !data.referenceEndFrom || !data.referenceEndTo || data.referenceEndTo >= data.referenceEndFrom, {
    message: 'Reference end end cannot be before start',
    path: ['referenceEndTo']
})

export type findObligationsByFiltersDTO = z.infer<typeof findObligationsByFiltersSchema>

export const findObligationsByEngagementQuerySchema = z.object({
    cursor: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10)
})

export type findObligationsByEngagementQueryDTO = z.infer<typeof findObligationsByEngagementQuerySchema>


export const deleteObligationWithMovementsSchema = z.object({
    deleteLinkedMovements: z.literal(true)
})

export type deleteObligationWithMovementsDTO = z.infer<typeof deleteObligationWithMovementsSchema>
