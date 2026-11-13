export interface OcorrenciaDeFalta {
    eventDate: Date
    absenceDays: number | null
    justificationStatus: string | null
    reversedAt: Date | null
}

const compararDiaUtc = (data: Date) =>
    Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate())

/**
 * Conta somente faltas registradas como injustificadas dentro do período.
 * Compara dias de calendário (não horários), e ignora ocorrências pendentes,
 * justificadas ou estornadas.
 */
export const contarFaltasInjustificadas = (
    ocorrencias: OcorrenciaDeFalta[],
    inicio: Date,
    fim: Date
): number => {
    const inicioDia = compararDiaUtc(inicio)
    const fimDia = compararDiaUtc(fim)
    if (fimDia < inicioDia) throw new Error('O fim do período não pode anteceder o início.')

    return ocorrencias.reduce((total, ocorrencia) => {
        const diaEvento = compararDiaUtc(ocorrencia.eventDate)
        const dentroDoPeriodo = diaEvento >= inicioDia && diaEvento <= fimDia
        const injustificada = ocorrencia.justificationStatus === 'injustificada'
        const ativa = ocorrencia.reversedAt === null
        return dentroDoPeriodo && injustificada && ativa
            ? total + (ocorrencia.absenceDays ?? 0)
            : total
    }, 0)
}
