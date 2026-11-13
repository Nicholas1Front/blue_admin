export const tiposDeAvisoPrevio = [
    'trabalhado',
    'indenizado',
    'dispensado',
    'nao_aplicavel'
] as const

export type TipoDeAvisoPrevio = typeof tiposDeAvisoPrevio[number]
