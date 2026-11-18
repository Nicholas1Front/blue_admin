import {
    findLatestSalaryCompetence,
    getSalaryAtDate,
    monthEnd,
    monthStart,
    roundCurrency,
    sameMonth,
    toNumber,
    utcDay
} from './salaryCalculation.js'
import type {
    CalculationItem,
    CalculationPeriod,
    CalculationResult,
    EngagementCalculationContext
} from './types.js'

const DAY_IN_MS = 24 * 60 * 60 * 1000

const countEligibleMonths = (
    entryDate: Date,
    exitDate: Date | null,
    year: number,
    lastMonth: number
) => {
    let count = 0

    for (let month = 1; month <= lastMonth; month += 1) {
        const start = monthStart(year, month)
        const end = monthEnd(year, month)
        const activeStart = utcDay(entryDate) > start ? utcDay(entryDate) : start
        const activeEnd = exitDate && utcDay(exitDate) < end ? utcDay(exitDate) : end

        if (activeEnd < activeStart) continue

        const daysWorked = Math.floor((activeEnd.getTime() - activeStart.getTime()) / DAY_IN_MS) + 1
        if (daysWorked >= 15) count += 1
    }

    return count
}

export const calculateThirteenthSalaryCompetencies = (
    context: EngagementCalculationContext,
    period: CalculationPeriod,
    today = new Date()
): CalculationResult => {
    if (!context.entryDate) {
        return {
            items: [],
            warnings: ['The engagement entry date is missing; thirteenth salary cannot be calculated safely.']
        }
    }

    if (['demitiu-se', 'demitido'].includes(context.status) && !context.exitDate) {
        return {
            items: [],
            warnings: ['The engagement is marked as terminated but has no exit date; thirteenth salary requires manual review.']
        }
    }

    const rangeStart = monthStart(period.startYear, period.startMonth)
    const rangeEnd = monthEnd(period.endYear, period.endMonth)
    const currentDate = utcDay(today)
    const items: CalculationItem[] = []
    const warnings: string[] = []

    for (let year = period.startYear; year <= period.endYear; year += 1) {
        const yearStart = new Date(Date.UTC(year, 0, 1))
        const yearEnd = new Date(Date.UTC(year, 11, 31))
        if (yearEnd < rangeStart || yearStart > rangeEnd) continue

        const calculationCutoff = rangeEnd < yearEnd ? rangeEnd : yearEnd
        const lastMonth = calculationCutoff.getUTCMonth() + 1
        const monthsWorked = countEligibleMonths(
            context.entryDate,
            context.exitDate,
            year,
            lastMonth
        )

        if (monthsWorked === 0) continue

        const latestSalaryCompetence = findLatestSalaryCompetence(context.obligations, calculationCutoff)
        const salary = latestSalaryCompetence
            ? {
                value: toNumber(latestSalaryCompetence.originalValue),
                assumed: false,
                warning: undefined as string | undefined
            }
            : (() => {
                const reference = getSalaryAtDate(context, calculationCutoff)
                return {
                    value: reference.value,
                    assumed: true,
                    ...(reference.warning ? { warning: reference.warning } : {})
                }
            })()

        const itemWarnings: string[] = []
        let requiresReview = false
        if (salary.warning) itemWarnings.push(salary.warning)
        if (salary.value === null || salary.value <= 0) {
            itemWarnings.push('No positive salary reference is available for the thirteenth salary estimate.')
            requiresReview = true
        }

        if (salary.assumed) {
            itemWarnings.push('No salary competence was found up to the calculation month; the engagement current salary or salary history is being used as an estimate.')
            if (year < currentDate.getUTCFullYear()) requiresReview = true
        }

        if (latestSalaryCompetence) {
            if (
                !latestSalaryCompetence.referenceStart ||
                !latestSalaryCompetence.referenceEnd ||
                !sameMonth(latestSalaryCompetence.referenceStart, latestSalaryCompetence.referenceEnd)
            ) {
                itemWarnings.push('The latest salary competence has incomplete or non-monthly reference dates; confirm the salary base.')
                requiresReview = true
            }

            const salaryDate = latestSalaryCompetence.referenceEnd ?? latestSalaryCompetence.referenceStart
            if (salaryDate && salaryDate.getUTCFullYear() < year) {
                itemWarnings.push(`The latest recorded salary competence is from ${String(salaryDate.getUTCMonth() + 1).padStart(2, '0')}/${salaryDate.getUTCFullYear()} and is being used as the reference.`)
            }
        }

        const terminationYear = Boolean(context.exitDate && context.exitDate.getUTCFullYear() === year)
        if (terminationYear || ['demitiu-se', 'demitido'].includes(context.status)) {
            itemWarnings.push('The engagement ended in or is marked as terminated for this period. Review the thirteenth salary with the termination records; severance is not calculated here.')
            requiresReview = true
        }

        if (context.status === 'afastado') {
            itemWarnings.push('The engagement is marked as away; the specific effects on thirteenth salary require manual review.')
            requiresReview = true
        }

        const estimatedValue = salary.value === null
            ? null
            : roundCurrency(salary.value / 12 * monthsWorked)
        const referenceStart = yearStart
        const referenceEnd = yearEnd
        const isProjection = calculationCutoff < yearEnd || yearEnd > currentDate

        items.push({
            type: 'decimo_terceiro',
            title: `Décimo terceiro ${year}`,
            referenceStart,
            referenceEnd,
            dueDate: new Date(Date.UTC(year, 11, 20)),
            estimatedValue,
            calculation: `Estimated amount: latest gross salary competence available up to ${String(lastMonth).padStart(2, '0')}/${year}, or current engagement salary when no salary competence exists, divided by 12 and multiplied by ${monthsWorked} eligible month(s). A month counts when at least 15 days of active engagement are recorded.`,
            warnings: [...new Set(itemWarnings)],
            requiresReview,
            isProjection,
            monthsWorked
        })
    }

    return { items, warnings }
}
