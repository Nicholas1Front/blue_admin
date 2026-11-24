import { z } from 'zod'
import { allowedMovementTypes, movementTypesRequiringObligation } from '../shareds/allowedMovementTypes.js'

const movementTypeSchema = z.enum(allowedMovementTypes)
const optionalDate = z.coerce.date().nullable().optional()
const optionalValue = z.coerce.number().finite().positive().multipleOf(0.01).nullable().optional()

const paymentBaseSchema = z.object({
    categoryId: z.string().min(1).optional(),
    createFinancialTransaction: z.boolean().optional(),
    financialTransactionId: z.string().min(1).optional(),
    obligationId: z.string().min(1),
    description: z.string().trim().min(1),
    value: z.coerce.number().finite().positive().multipleOf(0.01),
    eventDate: z.coerce.date().nullable().optional(),
    observations: z.string().trim().min(1).nullable().optional()
})

export const createPaymentSchema = paymentBaseSchema.refine(
    data => !(data.financialTransactionId && data.createFinancialTransaction === true),
    {
        message: 'An existing financial transaction cannot be combined with transaction creation',
        path: ['financialTransactionId']
    }
).superRefine((data, context) => {
    if (!data.financialTransactionId && data.createFinancialTransaction !== false && !data.categoryId) {
        context.addIssue({
            code: 'custom',
            message: 'A financial category is required when creating a financial transaction',
            path: ['categoryId']
        })
    }
})

export const updatePaymentSchema = paymentBaseSchema.omit({
    financialTransactionId: true
}).partial().extend({
    description: z.string().trim().min(1),
    value: z.coerce.number().finite().positive().multipleOf(0.01)
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update payment'
})

const movementObjectSchema = z.object({
    type: movementTypeSchema,
    description: z.string().trim().min(1),
    eventDate: optionalDate,
    referenceStart: optionalDate,
    referenceEnd: optionalDate,
    value: optionalValue,
    obligationId: z.string().min(1).nullable().optional(),
    observations: z.string().trim().min(1).nullable().optional()
})

const validateMovementPeriod = (data: {
    referenceStart?: Date | null | undefined
    referenceEnd?: Date | null | undefined
}) => !data.referenceStart || !data.referenceEnd || data.referenceEnd >= data.referenceStart

export const createMovementSchema = movementObjectSchema.refine(validateMovementPeriod, {
    message: 'Reference end cannot be before start',
    path: ['referenceEnd']
}).superRefine((data, context) => {
    if ((movementTypesRequiringObligation as readonly string[]).includes(data.type) && !data.obligationId) {
        context.addIssue({
            code: 'custom',
            message: 'This movement type requires an obligation',
            path: ['obligationId']
        })
    }
})

export const updateMovementSchema = movementObjectSchema.partial().refine(
    data => Object.keys(data).length > 0,
    { message: 'At least one field must be provided to update movement' }
).refine(validateMovementPeriod, {
    message: 'Reference end cannot be before start',
    path: ['referenceEnd']
})

export const findMovementsQuerySchema = z.object({
    type: movementTypeSchema.optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional()
}).refine(data => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
    message: 'End date cannot be before start date',
    path: ['endDate']
})

export type createMovementDTO = z.infer<typeof createMovementSchema>
export type updateMovementDTO = z.infer<typeof updateMovementSchema>
export type createPaymentDTO = z.infer<typeof createPaymentSchema>
export type updatePaymentDTO = z.infer<typeof updatePaymentSchema>
export type findMovementsQueryDTO = z.infer<typeof findMovementsQuerySchema>
