import { Prisma } from '../../../../generated/prisma/client.js'

export interface ResultadoDecimoTerceiro {
    mesesConsiderados: number
    valorEstimado: Prisma.Decimal
    observacao: string
}

/**
 * Conta os meses do ano com pelo menos 15 dias dentro do vínculo.
 * A regra dos 15 dias é aplicada como estimativa CLT; para outros vínculos,
 * o chamador deve confirmar a política administrativa adotada.
 */
export const contarMesesDecimoTerceiro = (
    dataInicio: Date,
    dataFim: Date,
    ano: number
): number => {
    if (dataFim < dataInicio) throw new Error('O fim do período não pode anteceder o início.')

    let meses = 0
    for (let mes = 0; mes < 12; mes += 1) {
        const inicioMes = new Date(Date.UTC(ano, mes, 1))
        const fimMes = new Date(Date.UTC(ano, mes + 1, 0))
        const inicioValido = dataInicio > inicioMes ? dataInicio : inicioMes
        const fimValido = dataFim < fimMes ? dataFim : fimMes

        if (fimValido < inicioValido) continue

        const diasNoPeriodo = Math.floor(
            (Date.UTC(fimValido.getUTCFullYear(), fimValido.getUTCMonth(), fimValido.getUTCDate()) -
                Date.UTC(inicioValido.getUTCFullYear(), inicioValido.getUTCMonth(), inicioValido.getUTCDate())) /
                86_400_000
        ) + 1

        if (diasNoPeriodo >= 15) meses += 1
    }

    return meses
}

export const calcularDecimoTerceiro = (
    remuneracaoBase: Prisma.Decimal | number,
    mesesConsiderados: number
): ResultadoDecimoTerceiro => {
    if (!Number.isInteger(mesesConsiderados) || mesesConsiderados < 0 || mesesConsiderados > 12) {
        throw new Error('A quantidade de meses deve ser um inteiro entre 0 e 12.')
    }

    const valorEstimado = new Prisma.Decimal(remuneracaoBase)
        .mul(mesesConsiderados)
        .div(12)
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)

    return {
        mesesConsiderados,
        valorEstimado,
        observacao: 'Estimativa sobre remuneração fixa informada. Médias variáveis, adicionais, afastamentos e particularidades contratuais precisam de revisão.'
    }
}
