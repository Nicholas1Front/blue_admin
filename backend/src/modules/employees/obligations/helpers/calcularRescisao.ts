import { Prisma } from '../../../../generated/prisma/client.js'

export interface ComponentesEstimativaRescisao {
    saldoSalario?: Prisma.Decimal | number
    decimoTerceiro?: Prisma.Decimal | number
    feriasVencidas?: Prisma.Decimal | number
    feriasProporcionais?: Prisma.Decimal | number
    avisoPrevio?: Prisma.Decimal | number
    multaFgts?: Prisma.Decimal | number
    outrosProventos?: Prisma.Decimal | number
    descontosRevisados?: Prisma.Decimal | number
    adiantamentosCompensaveisRevisados?: Prisma.Decimal | number
}

export interface ResultadoEstimativaRescisao {
    proventos: Prisma.Decimal
    descontos: Prisma.Decimal
    valorLiquidoEstimado: Prisma.Decimal
    exigeRevisao: true
    itens: Record<string, string>
}

/**
 * Consolida componentes previamente calculados/conferidos ou informados pelo
 * responsável. Não decide direitos pelo motivo do desligamento e não calcula
 * aviso, FGTS, INSS, IRRF ou descontos automaticamente. Adiantamentos só entram
 * como desconto quando o responsável os informar como compensáveis após revisão.
 */
export const calcularTotalEstimadoRescisao = (
    componentes: ComponentesEstimativaRescisao
): ResultadoEstimativaRescisao => {
    const nomes: Record<keyof ComponentesEstimativaRescisao, string> = {
        saldoSalario: 'Saldo de salário',
        decimoTerceiro: '13º proporcional',
        feriasVencidas: 'Férias adquiridas',
        feriasProporcionais: 'Férias proporcionais',
        avisoPrevio: 'Aviso prévio',
        multaFgts: 'Multa do FGTS',
        outrosProventos: 'Outros proventos',
        descontosRevisados: 'Descontos revisados',
        adiantamentosCompensaveisRevisados: 'Adiantamentos revisados para compensação'
    }

    const itens: Record<string, string> = {}
    let proventos = new Prisma.Decimal(0)
    let descontos = new Prisma.Decimal(0)

    for (const [chave, valor] of Object.entries(componentes) as [keyof ComponentesEstimativaRescisao, Prisma.Decimal | number | undefined][]) {
        if (valor === undefined) continue
        const decimal = new Prisma.Decimal(valor)
        if (decimal.isNegative()) throw new Error('Os componentes da estimativa devem ser não negativos.')
        itens[nomes[chave]] = decimal.toFixed(2)

        if (chave === 'descontosRevisados' || chave === 'adiantamentosCompensaveisRevisados') {
            descontos = descontos.plus(decimal)
        } else {
            proventos = proventos.plus(decimal)
        }
    }

    return {
        proventos: proventos.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP),
        descontos: descontos.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP),
        valorLiquidoEstimado: proventos.minus(descontos).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP),
        exigeRevisao: true,
        itens
    }
}
