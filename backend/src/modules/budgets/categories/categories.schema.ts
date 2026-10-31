import { z } from 'zod'
import { allowedBudgetCategoryType } from '../shared/allowedBudgetCategoryType.js'

export const createBudgetCategorySchema = z.object({
    name: z.string().trim().min(1),
    description: z.string().trim().min(1).nullable().optional(),
    type: z.enum(allowedBudgetCategoryType)
})

export const updateBudgetCategorySchema = z.object({
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).nullable().optional(),
    type: z.enum(allowedBudgetCategoryType).optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update category'
})

export type CreateBudgetCategoryDTO = z.infer<typeof createBudgetCategorySchema>
export type UpdateBudgetCategoryDTO = z.infer<typeof updateBudgetCategorySchema>
