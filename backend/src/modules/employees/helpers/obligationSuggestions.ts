import {
    calculateSalaryCompetencies,
    roundCurrency,
    sameDay,
    sameMonth,
    toNumber
} from '../obligations/calculations/salaryCalculation.js'
import {
    calculateVacationCompetencies
} from '../obligations/calculations/vacationCalculation.js'
import {
    calculateThirteenthSalaryCompetencies
} from '../obligations/calculations/thirteenthSalaryCalculation.js'
import type {
    CalculationItem,
    CalculationPeriod,
    EngagementCalculationContext,
    ObligationRecord
} from '../obligations/calculations/types.js'

type SuggestionAction = 'create' | 'update' | 'none' | 'manual_review'

type ObligationSuggestion = {
    type: CalculationItem['type']
    action: SuggestionAction
    title: string
    referenceStart: string
    referenceEnd: string
    dueDate: string | null
    estimatedValue: number | null
    recognizedValue: number | null
    recognizedStatus?: string
    paidValue: number
    balance: number | null
    calculation: string
    warnings: string[]
    isProjection: boolean
    monthsWorked?: number
    concessionDeadline?: string
    obligationId?: string
    createPayload?: {
        type: CalculationItem['type']
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

type AnalysisOptions = {
    calculateSalary: boolean
    calculateVacation: boolean
    calculateThirteenthSalary: boolean
}

const toISOString = (date: Date) => date.toISOString()

const findMatchingObligations = (
    obligations: ObligationRecord[],
    item: CalculationItem
) => obligations.filter(obligation => {
    if (obligation.type !== item.type) return false
    if (!obligation.referenceStart || !obligation.referenceEnd) return false

    if (item.type === 'salario') {
        return sameMonth(obligation.referenceStart, item.referenceStart) ||
            sameMonth(obligation.referenceEnd, item.referenceEnd)
    }

    if (item.type === 'decimo_terceiro') {
        return obligation.referenceStart.getUTCFullYear() === item.referenceStart.getUTCFullYear() ||
            obligation.referenceEnd.getUTCFullYear() === item.referenceEnd.getUTCFullYear()
    }

    if (item.type === 'ferias') {
        return sameDay(obligation.referenceStart, item.referenceStart) ||
            sameDay(obligation.referenceEnd, item.referenceEnd)
    }

    return false
})

const buildSuggestion = (
    item: CalculationItem,
    existingObligations: ObligationRecord[]
): ObligationSuggestion => {
    const warnings = [...item.warnings]
    const existing = existingObligations[0]
    const hasDuplicates = existingObligations.length > 1
    const hasInvalidReference = existing !== undefined && (
        item.type === 'salario'
            ? !sameMonth(existing.referenceStart ?? item.referenceStart, item.referenceStart) ||
                !sameMonth(existing.referenceEnd ?? item.referenceEnd, item.referenceEnd)
            : item.type === 'ferias'
                ? !sameDay(existing.referenceStart ?? item.referenceStart, item.referenceStart) ||
                    !sameDay(existing.referenceEnd ?? item.referenceEnd, item.referenceEnd)
                : existing.referenceStart?.getUTCFullYear() !== item.referenceStart.getUTCFullYear() ||
                    existing.referenceEnd?.getUTCFullYear() !== item.referenceEnd.getUTCFullYear()
    )

    if (hasDuplicates) {
        warnings.push('More than one obligation matches this reference period. Review the records before creating or changing anything.')
    }

    const allocatedValue = existing
        ? roundCurrency(existing.allocations.reduce(
            (total, allocation) => total + (toNumber(allocation.value) ?? 0),
            0
        ))
        : 0
    const recognizedValue = existing ? toNumber(existing.finalValue) : null
    const recognizedOriginalValue = existing ? toNumber(existing.originalValue) : null
    const paidValue = existing?.status === 'pago'
        ? Math.max(allocatedValue, recognizedValue ?? 0)
        : allocatedValue
    const balance = existing && recognizedValue !== null
        ? roundCurrency(Math.max(0, recognizedValue - paidValue))
        : null

    if (existing && recognizedValue !== null && paidValue > recognizedValue) {
        warnings.push('The allocated payment amount exceeds the recognized obligation value. Review the financial records.')
    }

    if (hasInvalidReference) {
        warnings.push('The existing obligation has an incomplete or different reference period. Review the reference dates before changing it.')
    }

    if (existing?.status === 'cancelado') {
        warnings.push('The existing obligation is cancelled. Review the cancellation before creating or changing another competence.')
    }

    if (existing?.status === 'parcial' && allocatedValue === 0) {
        warnings.push('The obligation is marked as partially paid but has no payment allocations to identify the paid amount.')
    }

    const hasFinancialRecords = Boolean(existing && (
        existing.allocations.length > 0 || existing.movements.length > 0
    ))
    const hasManualAdjustment = existing !== undefined &&
        recognizedOriginalValue !== null &&
        recognizedValue !== null &&
        Math.abs(recognizedOriginalValue - recognizedValue) >= 0.01
    const differs = existing !== undefined &&
        item.estimatedValue !== null &&
        recognizedOriginalValue !== null &&
        Math.abs(item.estimatedValue - recognizedOriginalValue) >= 0.01

    let action: SuggestionAction = 'none'

    if (hasDuplicates || hasInvalidReference || item.requiresReview) {
        action = 'manual_review'
    } else if (!existing) {
        action = item.estimatedValue !== null && item.estimatedValue > 0
            ? 'create'
            : 'manual_review'
    } else if (existing.status === 'cancelado') {
        action = 'manual_review'
    } else if (existing.status === 'parcial' && allocatedValue === 0) {
        action = 'manual_review'
    } else if (item.estimatedValue === null || recognizedOriginalValue === null) {
        action = 'manual_review'
    } else if (!differs) {
        action = 'none'
    } else if (
        !hasFinancialRecords &&
        !hasManualAdjustment &&
        !['parcial', 'pago', 'cancelado'].includes(existing.status)
    ) {
        action = 'update'
    } else {
        warnings.push('The obligation has linked financial records or a manual value adjustment. Review it before changing the amount.')
        action = 'manual_review'
    }

    const suggestion: ObligationSuggestion = {
        type: item.type,
        action,
        title: item.title,
        referenceStart: toISOString(item.referenceStart),
        referenceEnd: toISOString(item.referenceEnd),
        dueDate: existing?.dueDate
            ? toISOString(existing.dueDate)
            : item.dueDate ? toISOString(item.dueDate) : null,
        estimatedValue: item.estimatedValue,
        recognizedValue,
        ...(existing ? { recognizedStatus: existing.status } : {}),
        paidValue,
        balance,
        calculation: item.calculation,
        warnings: [...new Set(warnings)],
        isProjection: item.isProjection,
        ...(item.monthsWorked !== undefined ? { monthsWorked: item.monthsWorked } : {}),
        ...(item.concessionDeadline ? { concessionDeadline: toISOString(item.concessionDeadline) } : {}),
        ...(existing ? { obligationId: existing.id } : {})
    }

    if (!existing && action === 'create' && item.estimatedValue !== null) {
        suggestion.createPayload = {
            type: item.type,
            title: item.title,
            referenceStart: toISOString(item.referenceStart),
            referenceEnd: toISOString(item.referenceEnd),
            dueDate: item.dueDate ? toISOString(item.dueDate) : null,
            originalValue: item.estimatedValue,
            finalValue: item.estimatedValue,
            status: 'pendente',
            observations: item.calculation
        }
    }

    if (existing && action === 'update' && item.estimatedValue !== null) {
        suggestion.updatePayload = {
            originalValue: item.estimatedValue,
            finalValue: item.estimatedValue
        }
    }

    return suggestion
}

export const suggestBenefitObligations = (
    context: EngagementCalculationContext,
    period: CalculationPeriod,
    options: AnalysisOptions,
    today = new Date()
) => {
    const calculationResults = []

    if (options.calculateSalary) {
        calculationResults.push(calculateSalaryCompetencies(context, period, today))
    }

    if (options.calculateVacation) {
        calculationResults.push(calculateVacationCompetencies(context, period, today))
    }

    if (options.calculateThirteenthSalary) {
        calculationResults.push(calculateThirteenthSalaryCompetencies(context, period, today))
    }

    const items = calculationResults.flatMap(result => result.items)
    const warnings = calculationResults.flatMap(result => result.warnings)
    const suggestions = items
        .sort((left, right) =>
            left.referenceStart.getTime() - right.referenceStart.getTime() ||
            left.type.localeCompare(right.type)
        )
        .map(item => buildSuggestion(
            item,
            findMatchingObligations(context.obligations, item)
        ))

    return {
        period,
        suggestions,
        warnings: [...new Set(warnings)]
    }
}
