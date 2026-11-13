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
    adiantamentosDisponiveis?: Prisma.Decimal | number
}

export interface ResultadoEstimativaRescisao {
    proventos: Prisma.Decimal
    descontos: Prisma.Decimal
    valorLiquidoEstimado: Prisma.Decimal
    exigeRevisao: true
    itens: Record<string, string>
}

/**
 * Consolida componentes calculados/conferidos por outras rotinas ou informados
 * pelo responsável. Não decide direitos por motivo de desligamento e não calcula
 * aviso, FGTS, INSS, IRRF ou verbas legais automaticamente.
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
        adiantamentosDisponiveis: 'Adiantamentos a compensar'
    }

    const itens: Record<string, string> = {}
    let proventos = new Prisma.Decimal(0)
    let descontos = new Prisma.Decimal(0)

    for (const [chave, valor] of Object.entries(componentes) as [keyof ComponentesEstimativaRescisao, Prisma.Decimal | number | undefined][]) {
        if (valor === undefined) continue
        const decimal = new Prisma.Decimal(valor)
        if (decimal.isNegative()) throw new Error('Os componentes da estimativa devem ser não negativos.')
        itens[nomes[chave]] = decimal.toFixed(2)

        if (chave === 'descontosRevisados' || chave === 'adiantamentosDisponiveis') {
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
