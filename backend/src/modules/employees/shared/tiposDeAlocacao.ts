export const tiposDeAlocacao = [
    'pagamento',
    'credito_adiantamento',
    'aplicacao_adiantamento'
] as const

export type TipoDeAlocacao = typeof tiposDeAlocacao[number]
