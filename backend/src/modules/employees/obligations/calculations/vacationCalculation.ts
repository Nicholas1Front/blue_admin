import {
    addYears,
    getSalaryReference,
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

export const calculateVacationCompetencies = (
    context: EngagementCalculationContext,
    period: CalculationPeriod,
    today = new Date()
): CalculationResult => {
    if (!context.entryDate) {
        return {
            items: [],
            warnings: ['The engagement entry date is missing; vacation acquisition periods cannot be identified.']
        }
    }

    if (['demitiu-se', 'demitido'].includes(context.status) && !context.exitDate) {
        return {
            items: [],
            warnings: ['The engagement is marked as terminated but has no exit date; vacation periods require manual review.']
        }
    }

    const rangeStart = monthStart(period.startYear, period.startMonth)
    const rangeEnd = monthEnd(period.endYear, period.endMonth)
    const currentDate = utcDay(today)
    const activeEnd = context.exitDate ? utcDay(context.exitDate) : rangeEnd
    const items: CalculationItem[] = []
    const warnings: string[] = []
    let periodStart = utcDay(context.entryDate)
    let periodCount = 0

    while (periodCount < 80) {
        const nextPeriodStart = addYears(periodStart, 1)
        const periodEnd = new Date(nextPeriodStart.getTime() - DAY_IN_MS)
        if (periodEnd > activeEnd || periodEnd > rangeEnd) break

        if (periodEnd >= rangeStart) {
            const itemWarnings: string[] = []
            let requiresReview = false
            const matchingObligations = context.obligations.filter(obligation =>
                obligation.type === 'ferias' &&
                obligation.referenceStart !== null &&
                obligation.referenceEnd !== null &&
                sameMonth(obligation.referenceStart, periodStart) &&
                sameMonth(obligation.referenceEnd, periodEnd)
            )
            const salary = getSalaryReference(context, periodEnd)
            let usedExistingValue = false
            let estimatedValue = salary.value === null
                ? null
                : roundCurrency(salary.value + salary.value / 3)
            let calculation = 'Estimated full vacation amount: latest available gross salary reference for the acquisition period end plus one third. No taxes, variable additions, absences affecting vacation days, or suspension/loss of the acquisition period are calculated.'

            if (
                salary.assumed &&
                periodEnd < currentDate &&
                matchingObligations.length === 1
            ) {
                const recordedValue = toNumber(matchingObligations[0]?.originalValue ?? null)
                if (recordedValue !== null && recordedValue > 0) {
                    estimatedValue = recordedValue
                    usedExistingValue = true
                    calculation = 'Existing vacation obligation retained as the historical reference because the salary history is incomplete.'
                    itemWarnings.push('The existing vacation competence is being used as the historical value instead of replacing it with the current salary.')
                }
            } else if (salary.warning) {
                itemWarnings.push(salary.warning)
            }

            if ((!usedExistingValue && salary.value === null) || estimatedValue === null || estimatedValue <= 0) {
                itemWarnings.push('A reliable salary reference is not available for the vacation estimate.')
                requiresReview = true
            }
            if (salary.assumed && periodEnd < currentDate && matchingObligations.length === 0) {
                itemWarnings.push('The salary reference for this historical vacation period is estimated from the current salary; confirm the amount.')
                requiresReview = true
            }

            const concessionDeadline = addYears(periodEnd, 1)
            if (concessionDeadline < currentDate) {
                itemWarnings.push('The concession period has expired. Confirm whether the vacation was granted and whether any additional amount is due; no double payment is calculated automatically.')
                requiresReview = true
            }

            if (context.exitDate || ['demitiu-se', 'demitido'].includes(context.status)) {
                itemWarnings.push('The engagement is terminated; review vacation amounts in the context of the termination. Severance is not calculated here.')
                requiresReview = true
            }

            if (context.status === 'afastado') {
                itemWarnings.push('The engagement is marked as away; effects on the acquisition period require manual review.')
                requiresReview = true
            }

            if (matchingObligations.length > 1) {
                itemWarnings.push('More than one vacation obligation exists for this acquisition period.')
                requiresReview = true
            }

            if (matchingObligations.length === 0 && periodEnd < currentDate) {
                itemWarnings.push('No vacation obligation was found for this completed historical period. Missing registration does not prove that the vacation was not granted or paid.')
                requiresReview = true
            }

            const isProjection = periodEnd > currentDate
            items.push({
                type: 'ferias',
                title: `Férias ${periodStart.getUTCFullYear()}–${periodEnd.getUTCFullYear()}`,
                referenceStart: periodStart,
                referenceEnd: periodEnd,
                dueDate: null,
                estimatedValue,
                calculation,
                warnings: [...new Set(itemWarnings)],
                requiresReview,
                isProjection,
                concessionDeadline
            })
        }

        periodStart = nextPeriodStart
        periodCount += 1
    }

    if (periodCount >= 80) {
        warnings.push('The vacation history exceeds the supported 80 acquisition periods; the remaining periods were not analyzed.')
    }

    return { items, warnings }
}
