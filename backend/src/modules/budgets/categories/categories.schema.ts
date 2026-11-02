import { z } from 'zod'

const dateRange = (fromKey: string, toKey: string) => (filters: Record<string, unknown>) => {
    const from = filters[fromKey]
    const to = filters[toKey]
    return typeof from !== 'string' || typeof to !== 'string' || from <= to
}

export const createBudgetCategorySchema = z.object({
    name: z.string().trim().min(1),
    description: z.string().trim().min(1).nullable().optional()
})

export const updateBudgetCategorySchema = z.object({
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).nullable().optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update category'
})

export const findBudgetCategoriesByFiltersSchema = z.object({
    id: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional(),
    isActive: z.enum(['true', 'false']).transform(value => value === 'true').optional(),
    createdAtFrom: z.iso.date().optional(),
    createdAtTo: z.iso.date().optional(),
    updatedAtFrom: z.iso.date().optional(),
    updatedAtTo: z.iso.date().optional(),
    page: z.coerce.number().int().min(1).max(1000000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
}).refine(filters => Object.keys(filters).some(key => !['page', 'limit'].includes(key)), {
    message: 'At least one category filter must be provided'
}).refine(dateRange('createdAtFrom', 'createdAtTo'), {
    message: 'A data inicial deve ser anterior ou igual à data final',
    path: ['createdAtTo']
}).refine(dateRange('updatedAtFrom', 'updatedAtTo'), {
    message: 'A data inicial deve ser anterior ou igual à data final',
    path: ['updatedAtTo']
})

export type CreateBudgetCategoryDTO = z.infer<typeof createBudgetCategorySchema>
export type UpdateBudgetCategoryDTO = z.infer<typeof updateBudgetCategorySchema>
export type FindBudgetCategoriesByFiltersDTO = z.infer<typeof findBudgetCategoriesByFiltersSchema>
