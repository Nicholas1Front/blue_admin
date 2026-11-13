export const tiposDeObrigacao = [
    'salario',
    'decimo_terceiro',
    'ferias',
    'rescisao',
    'bonus',
    'comissao',
    'ajuste',
    'outro'
] as const

export type TipoDeObrigacao = typeof tiposDeObrigacao[number]
