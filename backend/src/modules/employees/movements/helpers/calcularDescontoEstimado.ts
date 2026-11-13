import { Prisma } from '../../../../generated/prisma/client.js'

/**
 * Estimativas para conferência manual. Não considera DSR, escalas, convenções,
 * justificativas legais ou limites específicos; jamais deve criar desconto sozinho.
 */
export const calcularDescontoEstimadoDeFalta = (
    remuneracaoMensal: Prisma.Decimal | number,
    dias: Prisma.Decimal | number
): Prisma.Decimal => {
    const quantidadeDias = new Prisma.Decimal(dias)
    const remuneracao = new Prisma.Decimal(remuneracaoMensal)
    if (quantidadeDias.isNegative()) throw new Error('A quantidade de dias não pode ser negativa.')
    if (remuneracao.isNegative()) throw new Error('A remuneração não pode ser negativa.')

    return remuneracao
        .div(30)
        .mul(quantidadeDias)
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
}

export const calcularDescontoEstimadoDeAtraso = (
    remuneracaoMensal: Prisma.Decimal | number,
    horasDiarias: Prisma.Decimal | number,
    minutosParaRevisao: number
): Prisma.Decimal => {
    if (!Number.isInteger(minutosParaRevisao) || minutosParaRevisao < 0) {
        throw new Error('Os minutos para revisão devem ser inteiros não negativos.')
    }

    const horas = new Prisma.Decimal(horasDiarias)
    const remuneracao = new Prisma.Decimal(remuneracaoMensal)
    if (!horas.isPositive()) throw new Error('A jornada diária precisa ser maior que zero.')
    if (remuneracao.isNegative()) throw new Error('A remuneração não pode ser negativa.')

    return remuneracao
        .div(30)
        .div(horas)
        .mul(minutosParaRevisao)
        .div(60)
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
}
