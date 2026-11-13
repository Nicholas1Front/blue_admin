export interface ResultadoAtrasos {
    totalMinutos: number
    minutosParaRevisao: number
    dentroDaToleranciaLegal: boolean
}

/**
 * Aplica somente a tolerância do art. 58, §1º, da CLT como triagem:
 * variações de até 5 minutos por marcação, observado o limite diário de 10.
 * Se ultrapassar qualquer limite, retorna o total para revisão, nunca um
 * desconto automático. A interpretação concreta deve considerar o controle
 * de ponto e as normas coletivas aplicáveis.
 */
export const avaliarAtrasosDoDia = (minutosPorMarcacao: number[]): ResultadoAtrasos => {
    if (minutosPorMarcacao.some(minutos => !Number.isInteger(minutos) || minutos < 0)) {
        throw new Error('Os minutos de cada marcação devem ser inteiros não negativos.')
    }

    const totalMinutos = minutosPorMarcacao.reduce((total, minutos) => total + minutos, 0)
    const dentroDaToleranciaLegal =
        minutosPorMarcacao.every(minutos => minutos <= 5) && totalMinutos <= 10

    return {
        totalMinutos,
        minutosParaRevisao: dentroDaToleranciaLegal ? 0 : totalMinutos,
        dentroDaToleranciaLegal
    }
}
