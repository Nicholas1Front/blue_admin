export const tiposDeMovimentacao = [
    'pagamento',
    'falta',
    'atraso',
    'saida_antecipada',
    'desconto',
    'ajuste',
    'bonus',
    'adiantamento',
    'aplicacao_adiantamento',
    'estorno',
    'registro_administrativo'
] as const

export type TipoDeMovimentacao = typeof tiposDeMovimentacao[number]
