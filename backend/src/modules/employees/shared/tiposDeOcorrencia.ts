export const tiposDeOcorrencia = [
    'falta',
    'atraso',
    'saida_antecipada',
    'desconto',
    'ajuste',
    'bonus',
    'registro_administrativo'
] as const

export type TipoDeOcorrencia = typeof tiposDeOcorrencia[number]
