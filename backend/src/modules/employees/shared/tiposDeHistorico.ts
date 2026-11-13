export const tiposDeHistorico = [
    'colaborador_criado',
    'dados_atualizados',
    'vinculo_criado',
    'vinculo_atualizado',
    'vinculo_encerrado',
    'salario_alterado',
    'obrigacao_criada',
    'obrigacao_revisada',
    'obrigacao_cancelada',
    'movimentacao_criada',
    'movimentacao_estornada',
    'pagamento_registrado',
    'adiantamento_reservado',
    'adiantamento_aplicado',
    'correcao_registrada'
] as const

export type TipoDeHistorico = typeof tiposDeHistorico[number]
