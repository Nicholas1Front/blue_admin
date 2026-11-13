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

    return new Prisma.Decimal(remuneracaoMensal)
        .div(30)
        .mul(diasConsiderados)
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
}
