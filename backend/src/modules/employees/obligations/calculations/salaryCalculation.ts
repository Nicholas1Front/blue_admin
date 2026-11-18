import type {
    CalculationItem,
    CalculationPeriod,
    CalculationResult,
    EngagementCalculationContext,
    NumericValue,
    ObligationRecord
} from './types.js'

const DAY_IN_MS = 24 * 60 * 60 * 1000

type SalaryChange = {
    effectiveDate: Date
    createdAt: Date
    previous: number | null
    current: number | null
}

export type SalaryReference = {
    value: number | null
    source: 'salary_competence' | 'salary_history' | 'current_salary' | 'unavailable'
    assumed: boolean
    warning?: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

export const toNumber = (value: NumericValue): number | null => {
    if (value === null) return null
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
}

export const roundCurrency = (value: number) =>
    Math.round((value + Number.EPSILON) * 100) / 100

export const utcDay = (date: Date) =>
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))

export const monthStart = (year: number, month: number) =>
    new Date(Date.UTC(year, month - 1, 1))

export const monthEnd = (year: number, month: number) =>
    new Date(Date.UTC(year, month, 0))

export const addYears = (date: Date, years: number) => {
    const result = new Date(Date.UTC(date.getUTCFullYear() + years, date.getUTCMonth(), 1))
    const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate()
    result.setUTCDate(Math.min(date.getUTCDate(), lastDay))
    return result
}

export const sameDay = (left: Date, right: Date) =>
    utcDay(left).getTime() === utcDay(right).getTime()

export const sameMonth = (left: Date, right: Date) =>
    left.getUTCFullYear() === right.getUTCFullYear() &&
    left.getUTCMonth() === right.getUTCMonth()

const readSalaryChanges = (context: EngagementCalculationContext) => {
    const changes: SalaryChange[] = []
    let incomplete = false

    for (const entry of context.history) {
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
            (previous !== null && (!Number.isFinite(previous) || previous < 0)) ||
            (current !== null && (!Number.isFinite(current) || current < 0))
        ) {
            incomplete = true
            continue
        }

        changes.push({
            effectiveDate: utcDay(entry.eventDate),
            createdAt: entry.createdAt,
            previous,
            current
        })
    }

    changes.sort((left, right) =>
        left.effectiveDate.getTime() - right.effectiveDate.getTime() ||
        left.createdAt.getTime() - right.createdAt.getTime()
    )

    return { changes, incomplete }
}

export const getSalaryAtDate = (
    context: EngagementCalculationContext,
    date: Date
): SalaryReference => {
    const currentSalary = toNumber(context.currentSalary)
    const { changes, incomplete } = readSalaryChanges(context)
    let salary = currentSalary ?? changes[changes.length - 1]?.current ?? null
    const targetDate = utcDay(date)

    for (let index = changes.length - 1; index >= 0; index -= 1) {
        const change = changes[index]
        if (change && change.effectiveDate > targetDate) salary = change.previous
    }

    if (salary === null) {
        return {
            value: null,
            source: 'unavailable',
            assumed: true,
            warning: 'No reliable salary value is available for the requested date.'
        }
    }

    const assumed = incomplete || changes.length === 0
    return {
        value: salary,
        source: assumed ? 'current_salary' : 'salary_history',
        assumed,
        ...(assumed
            ? { warning: 'The salary history is incomplete or unavailable; the current salary is being used as an estimate.' }
            : {})
    }
}

const getSalaryCompetenceDate = (obligation: ObligationRecord) =>
    obligation.referenceEnd ?? obligation.referenceStart

export const findLatestSalaryCompetence = (
    obligations: ObligationRecord[],
    referenceDate: Date
): ObligationRecord | null => {
    const candidates = obligations
        .filter(obligation => {
            if (obligation.type !== 'salario' || obligation.status === 'cancelado') return false
            const competenceDate = getSalaryCompetenceDate(obligation)
            return competenceDate !== null && utcDay(competenceDate) <= utcDay(referenceDate)
        })
        .sort((left, right) => {
            const leftDate = getSalaryCompetenceDate(left)
            const rightDate = getSalaryCompetenceDate(right)
            return (rightDate?.getTime() ?? 0) - (leftDate?.getTime() ?? 0) ||
                right.id.localeCompare(left.id)
        })

    return candidates[0] ?? null
}

export const getSalaryReference = (
    context: EngagementCalculationContext,
    referenceDate: Date
): SalaryReference => {
    const competence = findLatestSalaryCompetence(context.obligations, referenceDate)

    if (competence) {
        const competenceDate = getSalaryCompetenceDate(competence)
        const sameMonthCompetences = competenceDate
            ? context.obligations.filter(obligation => {
                const date = getSalaryCompetenceDate(obligation)
                return obligation.type === 'salario' && date !== null && sameMonth(date, competenceDate)
            })
            : []

        if (sameMonthCompetences.length > 1) {
            return {
                value: null,
                source: 'unavailable',
                assumed: true,
                warning: 'More than one salary competence exists for the latest month; confirm which value should be used.'
            }
        }

        const value = toNumber(competence.originalValue)
        const hasCompleteMonthlyReference = Boolean(
            competence.referenceStart &&
            competence.referenceEnd &&
            sameMonth(competence.referenceStart, competence.referenceEnd)
        )
        if (value !== null && value > 0) {
            const needsReview = !hasCompleteMonthlyReference || competence.status === 'em_revisao'
            return {
                value,
                source: 'salary_competence',
                assumed: needsReview,
                ...(needsReview
                    ? { warning: competence.status === 'em_revisao'
                        ? 'The latest salary competence is still under review.'
                        : 'The latest salary competence has incomplete or non-monthly reference dates.' }
                    : {})
            }
        }

        return {
            value: null,
            source: 'unavailable',
            assumed: true,
            warning: 'The latest salary competence has no positive gross amount.'
        }
    }

    return getSalaryAtDate(context, referenceDate)
}

const getMonthSalary = (
    context: EngagementCalculationContext,
    year: number,
    month: number,
    activeStart: Date,
    activeEnd: Date,
    today: Date
) => {
    const { changes } = readSalaryChanges(context)
    const monthDays = monthEnd(year, month).getUTCDate()
    const start = utcDay(activeStart)
    const end = utcDay(activeEnd)
    const boundaries = [start]

    for (const change of changes) {
        if (change.effectiveDate > start && change.effectiveDate <= end) {
            boundaries.push(change.effectiveDate)
        }
    }

    boundaries.sort((left, right) => left.getTime() - right.getTime())
    let total = 0
    let assumed = false
    const warnings: string[] = []

    for (let index = 0; index < boundaries.length; index += 1) {
        const segmentStart = boundaries[index]
        if (!segmentStart) continue

        const nextBoundary = boundaries[index + 1]
        const segmentEnd = nextBoundary
            ? new Date(nextBoundary.getTime() - DAY_IN_MS)
            : end
        const days = Math.floor((segmentEnd.getTime() - segmentStart.getTime()) / DAY_IN_MS) + 1
        if (days <= 0) continue

        let salary = getSalaryAtDate(context, segmentStart)
        if (segmentEnd < utcDay(today) && salary.assumed) {
            const latestCompetence = getSalaryReference(context, segmentStart)
            if (latestCompetence.source === 'salary_competence' && latestCompetence.value !== null) {
                salary = {
                    ...latestCompetence,
                    assumed: true,
                    warning: latestCompetence.warning ?? 'Salary estimated from the latest recorded salary competence.'
                }
            }
        }

        if (salary.value === null) {
            warnings.push(salary.warning ?? 'Salary could not be identified for part of this month.')
            return { value: null, assumed: true, warnings }
        }

        total += salary.value * days / monthDays
        assumed ||= salary.assumed
        if (salary.warning) warnings.push(salary.warning)
    }

    return {
        value: roundCurrency(total),
        assumed,
        warnings: [...new Set(warnings)]
    }
}

const getActiveDays = (
    entryDate: Date,
    exitDate: Date | null,
    monthFirstDay: Date,
    monthLastDay: Date
) => {
    const start = utcDay(entryDate) > monthFirstDay ? utcDay(entryDate) : monthFirstDay
    const end = exitDate && utcDay(exitDate) < monthLastDay ? utcDay(exitDate) : monthLastDay
    if (end < start) return null
    return { start, end }
}

const findMonthlySalaryObligations = (
    obligations: ObligationRecord[],
    start: Date,
    end: Date
) => obligations.filter(obligation =>
    obligation.type === 'salario' && (
        (obligation.referenceStart !== null && sameMonth(obligation.referenceStart, start)) ||
        (obligation.referenceEnd !== null && sameMonth(obligation.referenceEnd, end))
    )
)

export const calculateSalaryCompetencies = (
    context: EngagementCalculationContext,
    period: CalculationPeriod,
    today = new Date()
): CalculationResult => {
    const items: CalculationItem[] = []
    const warnings: string[] = []

    if (!context.entryDate) {
        return {
            items,
            warnings: ['The engagement entry date is missing; monthly salary competencies cannot be calculated safely.']
        }
    }

    if (['demitiu-se', 'demitido'].includes(context.status) && !context.exitDate) {
        return {
            items,
            warnings: ['The engagement is marked as terminated but has no exit date; salary competencies require manual review.']
        }
    }

    const rangeStart = monthStart(period.startYear, period.startMonth)
    const rangeEnd = monthEnd(period.endYear, period.endMonth)
    const currentDate = utcDay(today)
    const firstMonth = new Date(Date.UTC(rangeStart.getUTCFullYear(), rangeStart.getUTCMonth(), 1))
    const lastMonth = new Date(Date.UTC(rangeEnd.getUTCFullYear(), rangeEnd.getUTCMonth(), 1))

    for (
        let cursor = firstMonth;
        cursor <= lastMonth;
        cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1))
    ) {
        const year = cursor.getUTCFullYear()
        const month = cursor.getUTCMonth() + 1
        const start = monthStart(year, month)
        const end = monthEnd(year, month)
        const activePeriod = getActiveDays(context.entryDate, context.exitDate, start, end)
        if (!activePeriod) continue

        const existing = findMonthlySalaryObligations(context.obligations, start, end)
        const itemWarnings: string[] = []
        let requiresReview = false
        let estimatedValue: number | null = null
        let calculation = 'Gross monthly salary prorated by active calendar days and by each salary rate effective during the month.'

        if (existing.length > 1) {
            itemWarnings.push('More than one salary obligation exists for this month; review the records before changing them.')
            requiresReview = true
        }

        const existingObligation = existing[0]
        if (existing.length === 1 && existingObligation && (
            !existingObligation.referenceStart ||
            !existingObligation.referenceEnd ||
            !sameMonth(existingObligation.referenceStart, start) ||
            !sameMonth(existingObligation.referenceEnd, end)
        )) {
            itemWarnings.push('The existing salary obligation has incomplete or inconsistent reference dates.')
            requiresReview = true
        }

        if (context.status === 'afastado') {
            itemWarnings.push('The engagement is marked as away; the effects of this absence on salary are not calculated automatically.')
            requiresReview = true
        } else {
            const monthlySalary = getMonthSalary(
                context,
                year,
                month,
                activePeriod.start,
                activePeriod.end,
                currentDate
            )

            estimatedValue = monthlySalary.value
            itemWarnings.push(...monthlySalary.warnings)

            if (monthlySalary.assumed) {
                const isHistorical = end < currentDate
                itemWarnings.push(isHistorical
                    ? 'The current salary is being used for a past month without a complete salary history; confirm the historical amount.'
                    : 'The current salary is being used as the estimate because there is no complete salary history.')
                requiresReview ||= isHistorical
            }

            if (estimatedValue === null || estimatedValue <= 0) {
                itemWarnings.push('A positive salary amount could not be identified for this month.')
                requiresReview = true
            }

            if (existing.length === 1 && monthlySalary.assumed) {
                const recordedValue = toNumber(existing[0]?.originalValue ?? null)
                if (recordedValue !== null && recordedValue > 0) {
                    estimatedValue = recordedValue
                    calculation = 'Existing salary competence retained as the historical reference because the salary history is incomplete.'
                    itemWarnings.push('The existing salary competence is being used as the historical reference instead of replacing it with the current salary.')
                    requiresReview = existing[0]?.referenceStart === null || existing[0]?.referenceEnd === null
                        ? true
                        : requiresReview
                }
            }
        }

        const isProjection = end > currentDate
        items.push({
            type: 'salario',
            title: `Salário ${String(month).padStart(2, '0')}/${year}`,
            referenceStart: start,
            referenceEnd: end,
            dueDate: null,
            estimatedValue,
            calculation,
            warnings: [...new Set(itemWarnings)],
            requiresReview,
            isProjection
        })
    }

    return { items, warnings }
}
