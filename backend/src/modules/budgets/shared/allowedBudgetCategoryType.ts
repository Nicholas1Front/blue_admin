export const allowedBudgetCategoryType = [
    'servico',
    'peca'
] as const

export type BudgetCategoryType = typeof allowedBudgetCategoryType[number]
