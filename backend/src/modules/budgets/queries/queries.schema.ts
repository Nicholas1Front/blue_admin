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

export const findBudgetByIdParamsSchema = z.object({
    id: z.string().trim().min(1)
})

export const budgetDashboardQuerySchema = z.object({
    year: z.coerce.number().int().min(1).max(9998),
    month: z.coerce.number().int().min(1).max(12),
    page: z.coerce.number().int().min(1).max(1000000).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10)
})

export const budgetMetricsQuerySchema = z.object({
    year: z.coerce.number().int().min(1).max(9998)
})

export const findBudgetsByAdvancedFiltersSchema = z.object({
    search: z.string().trim().min(1).optional(),

    budgetId: z.string().trim().min(1).optional(),
    clientId: z.string().trim().min(1).optional(),
    clientName: z.string().trim().min(1).optional(),
    clientDocument: z.string().trim().min(1).optional(),
    equipamentId: z.string().trim().min(1).optional(),
    equipamentSearch: z.string().trim().min(1).optional(),
    status: z.string().trim().min(1).optional(),
    paymentCondition: z.string().trim().min(1).optional(),
    validity: z.string().trim().min(1).optional(),
    warranty: z.string().trim().min(1).optional(),
    deliveryTime: z.string().trim().min(1).optional(),
    observations: z.string().trim().min(1).optional(),

    totalAmountMin: z.coerce.number().min(0).optional(),
    totalAmountMax: z.coerce.number().min(0).optional(),
    globalDiscountMin: z.coerce.number().min(0).max(100).optional(),
    globalDiscountMax: z.coerce.number().min(0).max(100).optional(),
    finalAmountMin: z.coerce.number().min(0).optional(),
    finalAmountMax: z.coerce.number().min(0).optional(),
    createdAtFrom: z.iso.date().optional(),
    createdAtTo: z.iso.date().optional(),
    updatedAtFrom: z.iso.date().optional(),
    updatedAtTo: z.iso.date().optional(),

    itemId: z.string().trim().min(1).optional(),
    itemTitle: z.string().trim().min(1).optional(),
    itemDescription: z.string().trim().min(1).optional(),
    itemCategoryId: z.string().trim().min(1).optional(),
    itemCategoryName: z.string().trim().min(1).optional(),
    itemQuantityMin: z.coerce.number().positive().optional(),
    itemQuantityMax: z.coerce.number().positive().optional(),
    itemUnitValueMin: z.coerce.number().min(0).optional(),
    itemUnitValueMax: z.coerce.number().min(0).optional(),
    itemTotalAmountMin: z.coerce.number().min(0).optional(),
    itemTotalAmountMax: z.coerce.number().min(0).optional(),
    itemDiscountMin: z.coerce.number().min(0).max(100).optional(),
    itemDiscountMax: z.coerce.number().min(0).max(100).optional(),

    historyId: z.string().trim().min(1).optional(),
    historyEventType: z.string().trim().min(1).optional(),
    historyDescription: z.string().trim().min(1).optional(),
    historyCreatedAtFrom: z.iso.date().optional(),
    historyCreatedAtTo: z.iso.date().optional(),

    page: z.coerce.number().int().min(1).max(1000000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
}).refine(filters => Object.keys(filters).some(key => !['page', 'limit'].includes(key)), {
    message: 'At least one budget filter must be provided'
}).refine(numberRange('itemQuantityMin', 'itemQuantityMax'), {
    message: 'A quantidade mínima do item deve ser menor ou igual ao máximo',
    path: ['itemQuantityMax']
}).refine(dateRange('createdAtFrom', 'createdAtTo'), {
    message: 'A data inicial deve ser anterior ou igual à data final',
    path: ['createdAtTo']
}).refine(dateRange('updatedAtFrom', 'updatedAtTo'), {
    message: 'A data inicial deve ser anterior ou igual à data final',
    path: ['updatedAtTo']
}).refine(dateRange('historyCreatedAtFrom', 'historyCreatedAtTo'), {
    message: 'A data inicial deve ser anterior ou igual à data final',
    path: ['historyCreatedAtTo']
}).refine(numberRange('totalAmountMin', 'totalAmountMax'), {
    message: 'O valor total mínimo deve ser menor ou igual ao máximo',
    path: ['totalAmountMax']
}).refine(numberRange('globalDiscountMin', 'globalDiscountMax'), {
    message: 'O desconto global mínimo deve ser menor ou igual ao máximo',
    path: ['globalDiscountMax']
}).refine(numberRange('finalAmountMin', 'finalAmountMax'), {
    message: 'O valor final mínimo deve ser menor ou igual ao máximo',
    path: ['finalAmountMax']
}).refine(numberRange('itemUnitValueMin', 'itemUnitValueMax'), {
    message: 'O valor unitário mínimo deve ser menor ou igual ao máximo',
    path: ['itemUnitValueMax']
}).refine(numberRange('itemTotalAmountMin', 'itemTotalAmountMax'), {
    message: 'O valor do item mínimo deve ser menor ou igual ao máximo',
    path: ['itemTotalAmountMax']
}).refine(numberRange('itemDiscountMin', 'itemDiscountMax'), {
    message: 'O desconto mínimo deve ser menor ou igual ao máximo',
    path: ['itemDiscountMax']
})

export type BudgetDashboardQueryDTO = z.infer<typeof budgetDashboardQuerySchema>
export type BudgetMetricsQueryDTO = z.infer<typeof budgetMetricsQuerySchema>
export type FindBudgetsByAdvancedFiltersDTO = z.infer<typeof findBudgetsByAdvancedFiltersSchema>
