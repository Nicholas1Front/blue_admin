export const allowedBudgetStatus = [
    'rascunho',
    'enviado',
    'aprovado',
    'rejeitado',
    'expirado',
    'cancelado'
] as const

export type BudgetStatus = typeof allowedBudgetStatus[number]
