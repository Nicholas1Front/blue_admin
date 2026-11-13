import { Prisma } from '../../../../generated/prisma/client.js'

/**
 * Referência gerencial simples: remuneração mensal / (30 dias x horas diárias).
 * Não substitui divisor contratual, norma coletiva ou cálculo oficial de folha.
 */
export const calcularValorHoraReferencial = (
    remuneracaoMensal: Prisma.Decimal | number,
    horasDiarias: Prisma.Decimal | number
): Prisma.Decimal => {
    const salario = new Prisma.Decimal(remuneracaoMensal)
    const horas = new Prisma.Decimal(horasDiarias)

    if (salario.isNegative() || !horas.isPositive()) {
        throw new Error('Remuneração e jornada diária inválidas para o cálculo referencial.')
    }

    return salario.div(30).div(horas).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
}
