export interface OcorrenciaDeFalta {
    eventDate: Date
    absenceDays: number | null
    justificationStatus: string | null
    reversedAt: Date | null
}

/**
 * Conta somente faltas registradas como injustificadas dentro do período.
 * Ocorrências pendentes/justificadas ou estornadas não entram no total.
 */
export const contarFaltasInjustificadas = (
    ocorrencias: OcorrenciaDeFalta[],
    inicio: Date,
    fim: Date
): number => {
    if (fim < inicio) throw new Error('O fim do período não pode anteceder o início.')

    return ocorrencias.reduce((total, ocorrencia) => {
        const dentroDoPeriodo = ocorrencia.eventDate >= inicio && ocorrencia.eventDate <= fim
        const injustificada = ocorrencia.justificationStatus === 'injustificada'
        const ativa = ocorrencia.reversedAt === null
        return dentroDoPeriodo && injustificada && ativa
            ? total + (ocorrencia.absenceDays ?? 0)
            : total
    }, 0)
}
