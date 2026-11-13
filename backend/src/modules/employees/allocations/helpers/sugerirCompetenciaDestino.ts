import { Prisma } from '../../../../generated/prisma/client.js'

export interface CompetenciaElegivelParaAdiantamento {
    id: string
    type: string
    status: string
    referenceStart: Date | null
    dueDate: Date | null
    saldo: Prisma.Decimal | number
}

const inicioDoDiaUtc = (data: Date) =>
    Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate())

/**
 * Sugere a competência futura em aberto mais próxima. A sugestão não confirma
 * a destinação: a interface deve permitir que o responsável escolha outra
 * competência elegível antes de aplicar o crédito.
 */
export const sugerirCompetenciaDestino = (
    competencias: CompetenciaElegivelParaAdiantamento[],
    dataReferencia = new Date()
): CompetenciaElegivelParaAdiantamento | null => {
    const hoje = inicioDoDiaUtc(dataReferencia)

    const elegiveis = competencias.filter(competencia => {
        const saldo = new Prisma.Decimal(competencia.saldo)
        const dataReferenciaCompetencia = competencia.referenceStart ?? competencia.dueDate
        return (
            (competencia.status === 'pendente' || competencia.status === 'parcial') &&
            saldo.isPositive() &&
            dataReferenciaCompetencia !== null &&
            inicioDoDiaUtc(dataReferenciaCompetencia) > hoje
        )
    })

    elegiveis.sort((a, b) => {
        const dataA = a.referenceStart ?? a.dueDate
        const dataB = b.referenceStart ?? b.dueDate
        if (dataA && dataB) {
            const diferenca = inicioDoDiaUtc(dataA) - inicioDoDiaUtc(dataB)
            if (diferenca !== 0) return diferenca
        }
        if (a.type === 'salario' && b.type !== 'salario') return -1
        if (b.type === 'salario' && a.type !== 'salario') return 1
        return a.id.localeCompare(b.id)
    })

    return elegiveis[0] ?? null
}
