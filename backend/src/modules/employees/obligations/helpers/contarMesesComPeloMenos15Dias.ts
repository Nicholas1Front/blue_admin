const inicioDoDiaUtc = (data: Date) =>
    Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate())

/**
 * Conta meses de referência com pelo menos 15 dias corridos dentro do período.
 * Pode ser usado para estimativas proporcionais de 13º e férias; a elegibilidade
 * final ainda depende do tipo de vínculo, motivo de desligamento e afastamentos.
 */
export const contarMesesComPeloMenos15Dias = (
    dataInicio: Date,
    dataFim: Date
): number => {
    const inicioPeriodo = inicioDoDiaUtc(dataInicio)
    const fimPeriodo = inicioDoDiaUtc(dataFim)
    if (fimPeriodo < inicioPeriodo) throw new Error('O fim do período não pode anteceder o início.')

    let meses = 0
    let ano = dataInicio.getUTCFullYear()
    let mes = dataInicio.getUTCMonth()
    const ultimoAno = dataFim.getUTCFullYear()
    const ultimoMes = dataFim.getUTCMonth()

    while (ano < ultimoAno || (ano === ultimoAno && mes <= ultimoMes)) {
        const inicioMes = Date.UTC(ano, mes, 1)
        const fimMes = Date.UTC(ano, mes + 1, 0)
        const inicioValido = Math.max(inicioPeriodo, inicioMes)
        const fimValido = Math.min(fimPeriodo, fimMes)
        const diasNoPeriodo = Math.floor((fimValido - inicioValido) / 86_400_000) + 1

        if (diasNoPeriodo >= 15) meses += 1

        mes += 1
        if (mes === 12) {
            mes = 0
            ano += 1
        }
    }

    return meses
}
