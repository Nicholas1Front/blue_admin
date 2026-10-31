export const allowedBudgetCategoryType = [
    'serviços',
    'peças',
    'deslocamento'
] as const

export type BudgetCategoryType = typeof allowedBudgetCategoryType[number]
