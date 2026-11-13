import { Prisma } from '../../../../generated/prisma/client.js'
import { contarMesesComPeloMenos15Dias } from './contarMesesComPeloMenos15Dias.js'

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
    const inicioAno = new Date(Date.UTC(ano, 0, 1))
    const fimAno = new Date(Date.UTC(ano, 11, 31))
    const inicioValido = dataInicio > inicioAno ? dataInicio : inicioAno
    const fimValido = dataFim < fimAno ? dataFim : fimAno

    const inicioDia = Date.UTC(inicioValido.getUTCFullYear(), inicioValido.getUTCMonth(), inicioValido.getUTCDate())
    const fimDia = Date.UTC(fimValido.getUTCFullYear(), fimValido.getUTCMonth(), fimValido.getUTCDate())
    if (fimDia < inicioDia) return 0
    return contarMesesComPeloMenos15Dias(inicioValido, fimValido)
}

export const calcularDecimoTerceiro = (
    remuneracaoBase: Prisma.Decimal | number,
    mesesConsiderados: number
): ResultadoDecimoTerceiro => {
    if (!Number.isInteger(mesesConsiderados) || mesesConsiderados < 0 || mesesConsiderados > 12) {
        throw new Error('A quantidade de meses deve ser um inteiro entre 0 e 12.')
    }

    const remuneracao = new Prisma.Decimal(remuneracaoBase)
    if (remuneracao.isNegative()) throw new Error('A remuneração-base não pode ser negativa.')

    const valorEstimado = remuneracao
        .mul(mesesConsiderados)
        .div(12)
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)

    return {
        mesesConsiderados,
        valorEstimado,
        observacao: 'Estimativa sobre remuneração fixa informada. Médias variáveis, adicionais, afastamentos e particularidades contratuais precisam de revisão.'
    }
}
