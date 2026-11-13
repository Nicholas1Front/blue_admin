import { Prisma } from '../../../../generated/prisma/client.js'

/**
 * Estimativa administrativa/CLT de férias proporcionais: 1/12 da remuneração
 * por mês considerado, com adicional de 1/3. A elegibilidade dos meses,
 * motivo de rescisão, projeção do aviso e particularidades devem ser revisados.
 */
export const calcularFeriasProporcionais = (
    remuneracaoBase: Prisma.Decimal | number,
    mesesConsiderados: number
): Prisma.Decimal => {
    if (!Number.isInteger(mesesConsiderados) || mesesConsiderados < 0 || mesesConsiderados > 12) {
        throw new Error('A quantidade de meses deve ser um inteiro entre 0 e 12.')
    }

    return new Prisma.Decimal(remuneracaoBase)
        .mul(mesesConsiderados)
        .div(12)
        .mul(new Prisma.Decimal(4).div(3))
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
}
