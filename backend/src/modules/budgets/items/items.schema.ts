import { z } from 'zod'

const money = z.coerce.number().min(0)
const percentage = z.coerce.number().min(0).max(100)

export const createBudgetItemSchema = z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1).nullable().optional(),
    categoryId: z.string().min(1),
    quantity: z.coerce.number().positive(),
    unitValue: money,
    discount: percentage.default(0)
})

export const updateBudgetItemSchema = z.object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).nullable().optional(),
    categoryId: z.string().min(1).optional(),
    quantity: z.coerce.number().positive().optional(),
    unitValue: money.optional(),
    discount: percentage.optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update budget item'
})

export type CreateBudgetItemDTO = z.infer<typeof createBudgetItemSchema>
export type UpdateBudgetItemDTO = z.infer<typeof updateBudgetItemSchema>
