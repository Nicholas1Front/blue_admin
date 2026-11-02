import { z } from 'zod'
import { allowedBudgetStatus } from './shared/allowedBudgetStatus.js'

const optionalText = z.string().trim().min(1).nullable().optional()

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

export const createBudgetSchema = z.object({
    clientId: z.string().min(1),
    equipamentId: z.string().min(1),
    validity: z.string().trim().min(1).default('7 dias'),
    warranty: z.string().trim().min(1).default('30 dias'),
    deliveryTime: z.string().trim().min(1).default('7 dias'),
    paymentCondition: z.string().trim().min(1).default('À vista'),
    observations: optionalText,
    globalDiscount: z.coerce.number().min(0).max(100).default(0),
    status: z.enum(allowedBudgetStatus).default('rascunho')
})

export const createBudgetFromServiceSchema = z.object({
    serviceId: z.string().trim().min(1),
    items: z.array(z.object({
        activityId: z.string().trim().min(1),
        budgetCategoryId: z.string().trim().min(1)
    })).min(1).refine(
        items => new Set(items.map(item => item.activityId)).size === items.length,
        { message: 'Each service activity can only be imported once', path: ['items'] }
    )
})

export const updateBudgetSchema = z.object({
    clientId: z.string().min(1).optional(),
    equipamentId: z.string().min(1).optional(),
    validity: z.string().trim().min(1).optional(),
    warranty: z.string().trim().min(1).optional(),
    deliveryTime: z.string().trim().min(1).optional(),
    paymentCondition: z.string().trim().min(1).optional(),
    observations: optionalText,
    globalDiscount: z.coerce.number().min(0).max(100).optional(),
    status: z.enum(allowedBudgetStatus).optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update budget'
})

export const findBudgetsByFiltersSchema = z.object({
    id: z.string().trim().min(1).optional(),
    clientId: z.string().trim().min(1).optional(),
    equipamentId: z.string().trim().min(1).optional(),
    validity: z.string().trim().min(1).optional(),
    warranty: z.string().trim().min(1).optional(),
    deliveryTime: z.string().trim().min(1).optional(),
    paymentCondition: z.string().trim().min(1).optional(),
    observations: z.string().trim().min(1).optional(),
    status: z.string().trim().min(1).optional(),
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

    historyId: z.string().trim().min(1).optional(),
    historyEventType: z.string().trim().min(1).optional(),
    historyDescription: z.string().trim().min(1).optional(),
    historyCreatedAtFrom: z.iso.date().optional(),
    historyCreatedAtTo: z.iso.date().optional(),

    page: z.coerce.number().int().min(1).max(1000000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
}).refine(filters => Object.keys(filters).some(key => !['page', 'limit'].includes(key)), {
    message: 'At least one budget or history filter must be provided'
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
})

export type CreateBudgetDTO = z.infer<typeof createBudgetSchema>
export type CreateBudgetFromServiceDTO = z.infer<typeof createBudgetFromServiceSchema>
export type UpdateBudgetDTO = z.infer<typeof updateBudgetSchema>
export type FindBudgetsByFiltersDTO = z.infer<typeof findBudgetsByFiltersSchema>
