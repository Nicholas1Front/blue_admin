import { z } from 'zod'

const dateRange = (fromKey: string, toKey: string) => (filters: Record<string, unknown>) => {
    const from = filters[fromKey]
    const to = filters[toKey]
    return typeof from !== 'string' || typeof to !== 'string' || from <= to
}

const numberRange = (minKey: string, maxKey: string) => (filters: Record<string, unknown>) => {
    const min = filters[minKey]
    const max = filters[maxKey]
    return typeof min !== 'number' || typeof max !== 'number' || min <= max
}

const optionalText = z.string().trim().min(1).nullable().optional()

export const createBudgetPriceSchema = z.object({
    categoryId: z.string().trim().min(1),
    title: z.string().trim().min(1),
    description: optionalText,
    unitValue: z.coerce.number().min(0)
})

export const updateBudgetPriceSchema = z.object({
    categoryId: z.string().trim().min(1).optional(),
    title: z.string().trim().min(1).optional(),
    description: optionalText,
    unitValue: z.coerce.number().min(0).optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update budget price'
})

export const findBudgetPricesByFiltersSchema = z.object({
    id: z.string().trim().min(1).optional(),
    categoryId: z.string().trim().min(1).optional(),
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional(),
    unitValueMin: z.coerce.number().min(0).optional(),
    unitValueMax: z.coerce.number().min(0).optional(),
    createdAtFrom: z.iso.date().optional(),
    createdAtTo: z.iso.date().optional(),
    updatedAtFrom: z.iso.date().optional(),
    updatedAtTo: z.iso.date().optional(),
    page: z.coerce.number().int().min(1).max(1000000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
}).refine(filters => Object.keys(filters).some(key => !['page', 'limit'].includes(key)), {
    message: 'At least one price filter must be provided'
}).refine(dateRange('createdAtFrom', 'createdAtTo'), {
    message: 'A data inicial deve ser anterior ou igual à data final',
    path: ['createdAtTo']
}).refine(dateRange('updatedAtFrom', 'updatedAtTo'), {
    message: 'A data inicial deve ser anterior ou igual à data final',
    path: ['updatedAtTo']
}).refine(numberRange('unitValueMin', 'unitValueMax'), {
    message: 'O valor unitário mínimo deve ser menor ou igual ao máximo',
    path: ['unitValueMax']
})

export type CreateBudgetPriceDTO = z.infer<typeof createBudgetPriceSchema>
export type UpdateBudgetPriceDTO = z.infer<typeof updateBudgetPriceSchema>
export type FindBudgetPricesByFiltersDTO = z.infer<typeof findBudgetPricesByFiltersSchema>
