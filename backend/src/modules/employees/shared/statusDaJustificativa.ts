export const statusDaJustificativa = [
    'pendente',
    'justificada',
    'injustificada'
] as const

export type StatusDaJustificativa = typeof statusDaJustificativa[number]
