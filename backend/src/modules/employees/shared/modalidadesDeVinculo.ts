export const modalidadesDeVinculo = [
    'nao_formalizado',
    'clt',
    'pj',
    'outro'
] as const

export type ModalidadeDeVinculo = typeof modalidadesDeVinculo[number]
