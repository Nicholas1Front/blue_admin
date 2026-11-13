export const origensDaObrigacao = [
    'manual',
    'sugestao_sistema',
    'historico_importado'
] as const

export type OrigemDaObrigacao = typeof origensDaObrigacao[number]
