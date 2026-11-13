export const statusDoVinculo = [
    'ativo',
    'suspenso',
    'afastado',
    'encerrado'
] as const

export type StatusDoVinculo = typeof statusDoVinculo[number]
