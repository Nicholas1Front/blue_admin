export const statusDaObrigacao = [
    'em_revisao',
    'pendente',
    'parcial',
    'pago',
    'cancelado'
] as const

export type StatusDaObrigacao = typeof statusDaObrigacao[number]
