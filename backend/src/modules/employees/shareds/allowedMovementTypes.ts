export const allowedMovementTypes = [
    'falta',
    'atraso',
    'saida_antecipada',
    'bonificacao',
    'decimo_terceiro',
    'ferias',
    'rescisao',
    'ajuste',
    'anotacao'
] as const

export const movementTypesRequiringObligation = [
    'bonificacao',
    'decimo_terceiro',
    'ferias',
    'rescisao',
    'ajuste'
] as const
