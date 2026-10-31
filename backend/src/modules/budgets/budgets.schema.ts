import { z } from 'zod'
import { allowedBudgetStatus } from './shared/allowedBudgetStatus.js'

const optionalText = z.string().trim().min(1).nullable().optional()
const money = z.coerce.number().min(0)

export const createBudgetSchema = z.object({
    clientId: z.string().min(1),
    equipamentId: z.string().min(1),
    validity: z.string().trim().min(1).default('7 dias'),
    warranty: z.string().trim().min(1).default('30 dias'),
    deliveryTime: z.string().trim().min(1).default('7 dias'),
    paymentCondition: z.string().trim().min(1).default('À vista'),
    observations: optionalText,
    globalDiscount: money.default(0),
    status: z.enum(allowedBudgetStatus).default('rascunho')
})

export const updateBudgetSchema = z.object({
    clientId: z.string().min(1).optional(),
    equipamentId: z.string().min(1).optional(),
    validity: z.string().trim().min(1).optional(),
    warranty: z.string().trim().min(1).optional(),
    deliveryTime: z.string().trim().min(1).optional(),
    paymentCondition: z.string().trim().min(1).optional(),
    observations: optionalText,
    globalDiscount: money.optional(),
    status: z.enum(allowedBudgetStatus).optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update budget'
})

export type CreateBudgetDTO = z.infer<typeof createBudgetSchema>
export type UpdateBudgetDTO = z.infer<typeof updateBudgetSchema>
