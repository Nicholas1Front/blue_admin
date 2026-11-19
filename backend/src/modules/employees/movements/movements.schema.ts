import { z } from 'zod'
import { allowedMovementTypes } from '../shareds/allowedMovementTypes.js'

const movementTypeSchema = z.enum(allowedMovementTypes)
const optionalDate = z.coerce.date().nullable().optional()
const optionalValue = z.coerce.number().finite().positive().multipleOf(0.01).nullable().optional()
const allocationModeSchema = z.enum(['oldest', 'selected'])

const selectedAllocationsSchema = z.array(z.object({
    obligationId: z.string().min(1),
    value: z.coerce.number().finite().positive().multipleOf(0.01)
})).min(1).max(100).superRefine((allocations, context) => {
    const obligationIds = allocations.map(allocation => allocation.obligationId)
    if (new Set(obligationIds).size !== obligationIds.length) {
        context.addIssue({
            code: 'custom',
            message: 'Each obligation can only be selected once',
            path: []
        })
    }
})

const paymentObjectSchema = z.object({
    categoryId: z.string().min(1).optional(),
    createFinancialTransaction: z.boolean().optional(),
    description: z.string().trim().min(1),
    value: z.coerce.number().finite().positive().multipleOf(0.01),
    eventDate: z.coerce.date().nullable().optional(),
    observations: z.string().trim().min(1).nullable().optional(),
    allocationMode: allocationModeSchema,
    allocations: selectedAllocationsSchema.optional()
})

const validatePaymentAllocations = (
    data: z.infer<typeof paymentObjectSchema>,
    context: z.RefinementCtx
) => {
    if (data.allocationMode === 'selected' && !data.allocations) {
        context.addIssue({
            code: 'custom',
            message: 'Allocations are required when using manual allocation',
            path: ['allocations']
        })
    }

    if (data.allocationMode === 'oldest' && data.allocations !== undefined) {
        context.addIssue({
            code: 'custom',
            message: 'Manual allocations cannot be provided when using oldest-first allocation',
            path: ['allocations']
        })
    }

    if (data.allocations) {
        const allocatedCents = data.allocations.reduce((total, item) => total + Math.round(item.value * 100), 0)
        const paymentCents = Math.round(data.value * 100)
        if (allocatedCents > paymentCents) {
            context.addIssue({
                code: 'custom',
                message: 'Allocated value cannot exceed payment value',
                path: ['allocations']
            })
        }
    }
}

export const createPaymentSchema = paymentObjectSchema.superRefine((data, context) => {
    if (data.createFinancialTransaction !== false && !data.categoryId) {
        context.addIssue({
            code: 'custom',
            message: 'A financial category is required when creating a financial transaction',
            path: ['categoryId']
        })
    }

    validatePaymentAllocations(data, context)
})

export const updatePaymentSchema = paymentObjectSchema.superRefine(validatePaymentAllocations)


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
    message: 'Reference end cannot be before reference start',
    path: ['referenceEnd']
})

export const updateMovementSchema = movementObjectSchema.partial().refine(
    data => Object.keys(data).length > 0,
    { message: 'At least one field must be provided to update movement' }
).refine(validateMovementPeriod, {
    message: 'Reference end cannot be before reference start',
    path: ['referenceEnd']
})

export const findMovementsQuerySchema = z.object({
    type: movementTypeSchema.optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional()
}).refine(data => {
    if (!data.startDate || !data.endDate) return true
    return data.endDate >= data.startDate
}, {
    message: 'End date cannot be before start date',
    path: ['endDate']
})

export type createMovementDTO = z.infer<typeof createMovementSchema>
export type updateMovementDTO = z.infer<typeof updateMovementSchema>
export type createPaymentDTO = z.infer<typeof createPaymentSchema>
export type updatePaymentDTO = z.infer<typeof updatePaymentSchema>
export type findMovementsQueryDTO = z.infer<typeof findMovementsQuerySchema>
