import { Prisma } from '../../../../generated/prisma/client.js'

/**
 * Estimativa administrativa de saldo salarial para remuneração mensal.
 * Usa referência de 30 dias e exige revisão antes de virar obrigação.
 */
export const calcularSaldoSalario = (
    remuneracaoMensal: Prisma.Decimal | number,
    diasConsiderados: number
): Prisma.Decimal => {
    if (!Number.isInteger(diasConsiderados) || diasConsiderados < 0 || diasConsiderados > 30) {
        throw new Error('A quantidade de dias deve ser um inteiro entre 0 e 30.')
    }

    const remuneracao = new Prisma.Decimal(remuneracaoMensal)
    if (remuneracao.isNegative()) throw new Error('A remuneração não pode ser negativa.')

    return remuneracao
        .div(30)
        .mul(diasConsiderados)
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
}
