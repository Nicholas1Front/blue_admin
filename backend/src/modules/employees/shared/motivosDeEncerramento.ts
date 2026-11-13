export const motivosDeEncerramento = [
    'pedido_demissao',
    'dispensa_sem_justa_causa',
    'dispensa_com_justa_causa',
    'rescisao_indireta',
    'acordo',
    'termino_prazo',
    'outro'
] as const

export type MotivoDeEncerramento = typeof motivosDeEncerramento[number]
