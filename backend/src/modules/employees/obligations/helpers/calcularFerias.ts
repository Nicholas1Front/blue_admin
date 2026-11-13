import { Prisma } from '../../../../generated/prisma/client.js'

export const calcularDiasDeFeriasPorFaltas = (faltasInjustificadas: number): number => {
    if (!Number.isInteger(faltasInjustificadas) || faltasInjustificadas < 0) {
        throw new Error('A quantidade de faltas injustificadas deve ser um inteiro não negativo.')
    }

    if (faltasInjustificadas <= 5) return 30
    if (faltasInjustificadas <= 14) return 24
    if (faltasInjustificadas <= 23) return 18
    if (faltasInjustificadas <= 32) return 12
    return 0
}

/**
 * Estimativa de férias adquiridas CLT: remuneração proporcional aos dias
 * de direito acrescida de 1/3. Não calcula férias proporcionais de rescisão,
 * abono pecuniário, médias variáveis ou perda de período por afastamentos.
 */
export const calcularValorFeriasAdquiridas = (
    remuneracaoBase: Prisma.Decimal | number,
    diasDeDireito: number
): Prisma.Decimal => {
    if (![0, 12, 18, 24, 30].includes(diasDeDireito)) {
        throw new Error('Os dias de férias devem corresponder a 0, 12, 18, 24 ou 30.')
    }

    const remuneracao = new Prisma.Decimal(remuneracaoBase)
        .mul(diasDeDireito)
        .div(30)

    return remuneracao
        .mul(new Prisma.Decimal(4).div(3))
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
}
