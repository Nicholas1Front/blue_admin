import { z } from 'zod'
import { allowedMovementTypes } from '../shareds/allowedMovementTypes.js'

const movementTypeSchema = z.enum(allowedMovementTypes)
const optionalDate = z.coerce.date().nullable().optional()
const optionalValue = z.coerce.number().finite().positive().nullable().optional()
const allocationModeSchema = z.enum(['oldest', 'selected'])

const selectedAllocationsSchema = z.array(z.object({
    obligationId: z.string().min(1),
    value: z.coerce.number().finite().positive()
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

const paymentSchema = z.object({
    categoryId: z.string().min(1),
    description: z.string().trim().min(1),
    value: z.coerce.number().finite().positive(),
    eventDate: z.coerce.date().optional(),
    observations: z.string().trim().min(1).nullable().optional(),
    allocationMode: allocationModeSchema,
    allocations: selectedAllocationsSchema.optional()
}).superRefine((data, context) => {
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
        const allocatedValue = data.allocations.reduce((total, item) => total + item.value, 0)
        if (allocatedValue > data.value) {
            context.addIssue({
                code: 'custom',
                message: 'Allocated value cannot exceed payment value',
                path: ['allocations']
            })
        }
    }
})

export const createMovementSchema = z.object({
    type: movementTypeSchema.refine(type => type !== 'pagamento', {
        message: 'Use the payment endpoint to register a payment'
    }),
    description: z.string().trim().min(1),
    eventDate: optionalDate,
    referenceStart: optionalDate,
    referenceEnd: optionalDate,
    value: optionalValue,
    obligationId: z.string().min(1).nullable().optional(),
    observations: z.string().trim().min(1).nullable().optional()
}).refine(data => {
    if (!data.referenceStart || !data.referenceEnd) return true
    return data.referenceEnd >= data.referenceStart
}, {
    message: 'Reference end cannot be before reference start',
    path: ['referenceEnd']
})

export const updateMovementSchema = createMovementSchema.partial().refine(
    data => Object.keys(data).length > 0,
    { message: 'At least one field must be provided to update movement' }
).refine(data => data.type === undefined || data.type !== 'pagamento', {
    message: 'Payment movements must be updated through the payment endpoint',
    path: ['type']
})

export const createPaymentSchema = paymentSchema
export const updatePaymentSchema = paymentSchema

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
