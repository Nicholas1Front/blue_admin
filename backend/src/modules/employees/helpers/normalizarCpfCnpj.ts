import { AppError } from '../../../shared/errors/AppError.js'

const calcularDigitoVerificador = (base: string, pesos: number[]): number => {
    const soma = [...base].reduce(
        (total, caractere, indice) => total + (caractere.charCodeAt(0) - 48) * pesos[indice]!,
        0
    )
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
}

const validarCpf = (documento: string): boolean => {
    if (!/^\d{11}$/.test(documento) || /^([0-9])\1{10}$/.test(documento)) return false

    const primeiro = calcularDigitoVerificador(documento.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2])
    const segundo = calcularDigitoVerificador(documento.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2])

    return documento.endsWith(`${primeiro}${segundo}`)
}

const validarCnpj = (documento: string): boolean => {
    if (!/^[A-Z0-9]{12}\d{2}$/.test(documento) || /^([A-Z0-9])\1{13}$/.test(documento)) return false

    const primeiro = calcularDigitoVerificador(
        documento.slice(0, 12),
        [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    )
    const segundo = calcularDigitoVerificador(
        `${documento.slice(0, 12)}${primeiro}`,
        [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    )

    return documento.endsWith(`${primeiro}${segundo}`)
}

/**
 * Normaliza CPF e CNPJ sem descartar letras.
 * O CNPJ aceita letras e números nas 12 primeiras posições e dois dígitos
 * verificadores numéricos, conforme o formato implantado em julho de 2026.
 */
export const normalizarCpfCnpj = (
    documento?: string | null
): string | null | undefined => {
    if (documento === undefined) return undefined
    if (documento === null || documento.trim() === '') return null

    const normalizado = documento.toUpperCase().replace(/[^A-Z0-9]/g, '')

    if (normalizado.length === 11 && validarCpf(normalizado)) return normalizado
    if (normalizado.length === 14 && validarCnpj(normalizado)) return normalizado

    throw new AppError('CPF/CNPJ is invalid', 400, 'INVALID_EMPLOYEE_DOCUMENT')
}
