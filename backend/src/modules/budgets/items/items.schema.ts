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

export const createBudgetItemSchema = z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1).nullable().optional(),
    categoryId: z.string().min(1),
    quantity: z.coerce.number().positive(),
    unitValue: z.coerce.number().min(0),
    discount: z.coerce.number().min(0).max(100).default(0)
})

export const updateBudgetItemSchema = z.object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).nullable().optional(),
    categoryId: z.string().min(1).optional(),
    quantity: z.coerce.number().positive().optional(),
    unitValue: z.coerce.number().min(0).optional(),
    discount: z.coerce.number().min(0).max(100).optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update budget item'
})

export const findBudgetItemsByFiltersSchema = z.object({
    id: z.string().trim().min(1).optional(),
    budgetId: z.string().trim().min(1).optional(),
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional(),
    categoryId: z.string().trim().min(1).optional(),
    quantityMin: z.coerce.number().positive().optional(),
    quantityMax: z.coerce.number().positive().optional(),
    unitValueMin: z.coerce.number().min(0).optional(),
    unitValueMax: z.coerce.number().min(0).optional(),
    totalAmountMin: z.coerce.number().min(0).optional(),
    totalAmountMax: z.coerce.number().min(0).optional(),
    discountMin: z.coerce.number().min(0).max(100).optional(),
    discountMax: z.coerce.number().min(0).max(100).optional(),
    createdAtFrom: z.iso.date().optional(),
    createdAtTo: z.iso.date().optional(),
    updatedAtFrom: z.iso.date().optional(),
    updatedAtTo: z.iso.date().optional(),
    page: z.coerce.number().int().min(1).max(1000000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
}).refine(filters => Object.keys(filters).some(key => !['page', 'limit'].includes(key)), {
    message: 'At least one item filter must be provided'
}).refine(dateRange('createdAtFrom', 'createdAtTo'), {
    message: 'A data inicial deve ser anterior ou igual à data final',
    path: ['createdAtTo']
}).refine(dateRange('updatedAtFrom', 'updatedAtTo'), {
    message: 'A data inicial deve ser anterior ou igual à data final',
    path: ['updatedAtTo']
}).refine(numberRange('quantityMin', 'quantityMax'), {
    message: 'A quantidade mínima deve ser menor ou igual à máxima',
    path: ['quantityMax']
}).refine(numberRange('unitValueMin', 'unitValueMax'), {
    message: 'O valor unitário mínimo deve ser menor ou igual ao máximo',
    path: ['unitValueMax']
}).refine(numberRange('totalAmountMin', 'totalAmountMax'), {
    message: 'O valor total mínimo deve ser menor ou igual ao máximo',
    path: ['totalAmountMax']
}).refine(numberRange('discountMin', 'discountMax'), {
    message: 'O desconto mínimo deve ser menor ou igual ao máximo',
    path: ['discountMax']
})

export type CreateBudgetItemDTO = z.infer<typeof createBudgetItemSchema>
export type UpdateBudgetItemDTO = z.infer<typeof updateBudgetItemSchema>
export type FindBudgetItemsByFiltersDTO = z.infer<typeof findBudgetItemsByFiltersSchema>
