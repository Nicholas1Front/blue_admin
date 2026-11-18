type NumericValue = number | { toString(): string } | null

type SalaryChange = {
    date: Date
    previous: number | null
    current: number | null
}

type HistoryEntry = {
    eventType: string
    eventDate: Date | null
    metadata: unknown
}

type ExistingObligation = {
    id: string
    type: string
    title: string
    referenceStart: Date | null
    referenceEnd: Date | null
    dueDate: Date | null
    originalValue: NumericValue
    finalValue: NumericValue
    status: string
    allocations: { value: NumericValue }[]
    movements: { id: string }[]
}

type BenefitEngagement = {
    id: string
    entryDate: Date | null
    exitDate: Date | null
    status: string
    currentSalary: NumericValue
    history: HistoryEntry[]
    obligations: ExistingObligation[]
}

type Suggestion = {
    benefit: 'ferias' | 'decimo_terceiro'
    action: 'create' | 'update' | 'none' | 'manual_review'
    title: string
    referenceStart: string
    referenceEnd: string
    dueDate: string | null
    estimatedValue: number | null
    recognizedValue: number | null
    paidValue: number
    balance: number | null
    monthsWorked?: number
    concessionDeadline?: string
    calculation: string
    warnings: string[]
    obligationId?: string
    createPayload?: {
        type: 'ferias' | 'decimo_terceiro'
        title: string
        referenceStart: string
        referenceEnd: string
        dueDate: string | null
        originalValue: number
        finalValue: number
        status: 'pendente'
        observations: string
    }
    updatePayload?: {
        originalValue: number
        finalValue: number
    }
}

const DAY_IN_MS = 24 * 60 * 60 * 1000

const toNumber = (value: NumericValue): number | null => {
    if (value === null) return null
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
}

const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

const toUtcDate = (date: Date) => new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
))

const addMonths = (date: Date, months: number) => {
    const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1))
    const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate()
    result.setUTCDate(Math.min(date.getUTCDate(), lastDay))
    return result
}

const addYears = (date: Date, years: number) => addMonths(date, years * 12)

const formatDate = (date: Date) => date.toISOString()

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

const readSalaryChanges = (history: HistoryEntry[]) => {
    const changes: SalaryChange[] = []
    let incomplete = false

    for (const entry of history) {
        if (entry.eventType !== 'salario_vinculo_atualizado') continue

        if (!entry.eventDate || !isRecord(entry.metadata)) {
            incomplete = true
            continue
        }

        const metadataChanges = entry.metadata.changes
        if (!isRecord(metadataChanges) || !isRecord(metadataChanges.currentSalary)) {
            incomplete = true
            continue
        }

        const salaryChange = metadataChanges.currentSalary
        const previous = salaryChange.previous === null ? null : Number(salaryChange.previous)
        const current = salaryChange.current === null ? null : Number(salaryChange.current)

        if (
            (previous !== null && !Number.isFinite(previous)) ||
            (current !== null && !Number.isFinite(current))
        ) {
            incomplete = true
            continue
        }

        changes.push({ date: entry.eventDate, previous, current })
    }

    return {
        changes: changes.sort((a, b) => a.date.getTime() - b.date.getTime()),
        incomplete
    }
}

const createSalaryLookup = (engagement: BenefitEngagement) => {
    const currentSalary = toNumber(engagement.currentSalary)
    const { changes, incomplete } = readSalaryChanges(engagement.history)

    return (date: Date) => {
        let salary = currentSalary

        for (let index = changes.length - 1; index >= 0; index -= 1) {
            const change = changes[index]
            if (change && change.date > date) salary = change.previous
        }

        if (salary === null) {
            const firstChange = changes[0]
            if (firstChange && firstChange.date > date) salary = firstChange.previous
        }

        return {
            value: salary,
            assumed: changes.length === 0 || incomplete
        }
    }
}

const findExistingObligation = (
    obligations: ExistingObligation[],
    type: 'ferias' | 'decimo_terceiro',
    start: Date,
    end: Date
) => obligations.find(obligation =>
    obligation.type === type &&
    obligation.referenceStart?.getTime() === start.getTime() &&
    obligation.referenceEnd?.getTime() === end.getTime()
)

const buildSuggestion = (
    benefit: 'ferias' | 'decimo_terceiro',
    title: string,
    start: Date,
    end: Date,
    dueDate: Date | null,
    estimatedValue: number | null,
    calculation: string,
    warnings: string[],
    existing?: ExistingObligation,
    extra?: { monthsWorked?: number; concessionDeadline?: Date }
): Suggestion => {
    const allocatedValue = existing
        ? roundCurrency(existing.allocations.reduce((total, allocation) => total + (toNumber(allocation.value) ?? 0), 0))
        : 0
    const paidValue = existing?.status === 'pago'
        ? Math.max(allocatedValue, toNumber(existing.finalValue) ?? 0)
        : allocatedValue
    const recognizedValue = existing ? toNumber(existing.finalValue) : null
    const balance = recognizedValue === null ? null : roundCurrency(Math.max(0, recognizedValue - paidValue))
    const hasFinancialRecords = Boolean(existing && (
        existing.allocations.length > 0 || existing.movements.length > 0
    ))
    const canUpdate = Boolean(existing && !hasFinancialRecords && !['parcial', 'pago', 'cancelado'].includes(existing.status))
    const differs = existing && estimatedValue !== null && recognizedValue !== null &&
        Math.abs(estimatedValue - recognizedValue) >= 0.01

    let action: Suggestion['action'] = estimatedValue === null ? 'manual_review' : 'create'
    if (existing && estimatedValue !== null && differs && canUpdate) action = 'update'
    else if (existing && estimatedValue !== null && !differs) action = 'none'
    else if (existing && estimatedValue !== null && differs) action = 'manual_review'
    if (existing && differs && hasFinancialRecords) {
        warnings.push('A obrigação possui movimentações ou alocações; revise manualmente antes de alterar o valor.')
        action = 'manual_review'
    }

    const suggestion: Suggestion = {
        benefit,
        action,
        title,
        referenceStart: formatDate(start),
        referenceEnd: formatDate(end),
        dueDate: dueDate ? formatDate(dueDate) : null,
        estimatedValue,
        recognizedValue,
        paidValue,
        balance,
        calculation,
        warnings,
        ...(extra?.monthsWorked !== undefined ? { monthsWorked: extra.monthsWorked } : {}),
        ...(extra?.concessionDeadline ? { concessionDeadline: formatDate(extra.concessionDeadline) } : {}),
        ...(existing ? { obligationId: existing.id } : {})
    }

    if (!existing && action === 'create' && estimatedValue !== null) {
        suggestion.createPayload = {
            type: benefit,
            title,
            referenceStart: formatDate(start),
            referenceEnd: formatDate(end),
            dueDate: dueDate ? formatDate(dueDate) : null,
            originalValue: estimatedValue,
            finalValue: estimatedValue,
            status: 'pendente',
            observations: calculation
        }
    }

    if (existing && action === 'update' && estimatedValue !== null) {
        suggestion.updatePayload = {
            originalValue: estimatedValue,
            finalValue: estimatedValue
        }
    }

    return suggestion
}

const getMonthsWorked = (entryDate: Date, endDate: Date, year: number) => {
    const months: { month: number; salaryDate: Date }[] = []
    const yearStart = new Date(Date.UTC(year, 0, 1))
    const yearEnd = new Date(Date.UTC(year, 11, 31))
    const start = toUtcDate(entryDate) > yearStart ? toUtcDate(entryDate) : yearStart
    const end = toUtcDate(endDate) < yearEnd ? toUtcDate(endDate) : yearEnd

    if (end < start) return months

    for (let month = 0; month < 12; month += 1) {
        const monthStart = new Date(Date.UTC(year, month, 1))
        const monthEnd = new Date(Date.UTC(year, month + 1, 0))
        const workedStart = start > monthStart ? start : monthStart
        const workedEnd = end < monthEnd ? end : monthEnd
        if (workedEnd < workedStart) continue

        const daysWorked = Math.floor((workedEnd.getTime() - workedStart.getTime()) / DAY_IN_MS) + 1
        if (daysWorked >= 15) months.push({ month, salaryDate: workedEnd })
    }

    return months
}

export const suggestBenefitObligations = (
    engagement: BenefitEngagement,
    fromYear: number,
    toYear: number,
    today = new Date()
) => {
    const suggestions: Suggestion[] = []
    const warnings: string[] = []
    const salaryAt = createSalaryLookup(engagement)
    const currentDate = toUtcDate(today)

    if (!engagement.entryDate) {
        return {
            suggestions,
            warnings: ['A data de entrada do vínculo não foi informada. Não é possível determinar competências de férias ou décimo terceiro com segurança.']
        }
    }

    if (fromYear > toYear || toYear - fromYear > 40) {
        return {
            suggestions,
            warnings: ['O intervalo solicitado é inválido ou excede 40 anos.']
        }
    }

    if (engagement.currentSalary === null && engagement.history.length === 0) {
        warnings.push('O salário bruto não está informado e não há histórico salarial.')
    }

    for (let year = fromYear; year <= toYear && year <= currentDate.getUTCFullYear(); year += 1) {
        const yearStart = new Date(Date.UTC(year, 0, 1))
        const yearEnd = new Date(Date.UTC(year, 11, 31))
        const activeEnd = engagement.exitDate
            ? toUtcDate(engagement.exitDate)
            : currentDate
        const months = getMonthsWorked(engagement.entryDate, activeEnd, year)

        if (months.length === 0) continue

        let total = 0
        let missingSalary = false
        let assumedSalary = false

        for (const month of months) {
            const salary = salaryAt(month.salaryDate)
            if (salary.value === null) {
                missingSalary = true
                continue
            }
            total += salary.value / 12
            assumedSalary ||= salary.assumed
        }

        const estimatedValue = missingSalary ? null : roundCurrency(total)
        const yearWarnings: string[] = []
        if (missingSalary) yearWarnings.push('Não há salário bruto identificável para todos os meses considerados.')
        if (assumedSalary) yearWarnings.push('Parte do cálculo utiliza o salário atual como referência porque o histórico salarial está incompleto ou ausente.')
        if (engagement.status === 'afastado') {
            yearWarnings.push('O vínculo está afastado. O helper não avalia os efeitos específicos do afastamento sobre o décimo terceiro.')
        }

        const terminationYear = Boolean(engagement.exitDate && engagement.exitDate.getUTCFullYear() === year)
        if (terminationYear) {
            yearWarnings.push('O vínculo terminou neste ano. O valor proporcional exige conferência no contexto da rescisão e não deve ser criado automaticamente.')
        } else if (['demitiu-se', 'demitido'].includes(engagement.status)) {
            yearWarnings.push('O vínculo consta como encerrado, mas não possui data de saída; confirme o período antes de reconhecer a obrigação.')
        }

        const existing = findExistingObligation(
            engagement.obligations,
            'decimo_terceiro',
            yearStart,
            yearEnd
        )
        const dueDate = new Date(Date.UTC(year, 11, 20))
        const calculation = `Estimativa: soma do salário bruto de cada mês elegível dividido por 12. Meses considerados: ${months.length}. Fórmula acordada: salário bruto / 12 * meses trabalhados. O pagamento pode ocorrer em parcela única até 30/11 ou em duas parcelas, com a segunda até 20/12.`

        const suggestion = buildSuggestion(
            'decimo_terceiro',
            `Décimo terceiro ${year}`,
            yearStart,
            yearEnd,
            dueDate,
            estimatedValue,
            calculation,
            yearWarnings,
            existing,
            { monthsWorked: months.length }
        )

        if (terminationYear || ['demitiu-se', 'demitido'].includes(engagement.status)) {
            suggestion.action = 'manual_review'
            delete suggestion.createPayload
            delete suggestion.updatePayload
        }

        suggestions.push(suggestion)
    }

    let periodStart = toUtcDate(engagement.entryDate)
    let periodIndex = 0
    const vacationEndLimit = engagement.exitDate
        ? toUtcDate(engagement.exitDate)
        : currentDate

    while (periodIndex < 80) {
        const nextPeriodStart = addYears(periodStart, 1)
        const periodEnd = new Date(nextPeriodStart.getTime() - DAY_IN_MS)
        if (periodEnd > vacationEndLimit) break
        if (periodEnd.getUTCFullYear() < fromYear) {
            periodStart = nextPeriodStart
            periodIndex += 1
            continue
        }
        if (periodEnd.getUTCFullYear() > toYear) break

        const salary = salaryAt(periodEnd)
        const estimatedValue = salary.value === null
            ? null
            : roundCurrency(salary.value + salary.value / 3)
        const periodWarnings: string[] = []
        if (salary.value === null) periodWarnings.push('Não há salário bruto identificável para estimar as férias.')
        if (salary.assumed) periodWarnings.push('O cálculo utiliza o salário atual como referência porque o histórico salarial está incompleto ou ausente.')
        if (engagement.status === 'afastado') {
            periodWarnings.push('O vínculo está afastado. O helper não avalia os efeitos específicos do afastamento sobre o período aquisitivo.')
        }

        const concessionDeadline = new Date(addYears(nextPeriodStart, 1).getTime() - DAY_IN_MS)
        const terminationPeriod = Boolean(engagement.exitDate)
        if (concessionDeadline < currentDate && !engagement.exitDate) {
            periodWarnings.push('O prazo concessivo já terminou. Confirme se as férias foram concedidas; se houve concessão fora do prazo, pode existir obrigação de pagamento em dobro.')
        }
        if (terminationPeriod) {
            periodWarnings.push('O vínculo foi encerrado. A situação das férias deve ser conferida junto à rescisão; o helper não calcula verbas rescisórias.')
        }

        const concessionPeriodExpired = concessionDeadline < currentDate && !engagement.exitDate
        const existing = findExistingObligation(
            engagement.obligations,
            'ferias',
            periodStart,
            periodEnd
        )
        const calculation = 'Estimativa para período aquisitivo completo: salário bruto de referência + 1/3, sem retenções ou impostos. Não considera abono pecuniário, faltas que reduzam dias, adicionais variáveis ou hipóteses de suspensão/perda do período.'

        const suggestion = buildSuggestion(
            'ferias',
            `Férias ${periodStart.getUTCFullYear()}–${periodEnd.getUTCFullYear()}`,
            periodStart,
            periodEnd,
            null,
            estimatedValue,
            calculation,
            periodWarnings,
            existing,
            { concessionDeadline }
        )

        if (terminationPeriod || concessionPeriodExpired) {
            suggestion.action = 'manual_review'
            delete suggestion.createPayload
            delete suggestion.updatePayload
        }

        suggestions.push(suggestion)
        periodStart = nextPeriodStart
        periodIndex += 1
    }

    return { suggestions, warnings }
}
