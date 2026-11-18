import { AppError } from '../../../shared/errors/AppError.js'
import { repeatableObligationTypes } from '../shareds/repeatableObligationTypes.js'
import { suggestBenefitObligations } from '../helpers/obligationSuggestions.js'
import obligationsRepository from './obligations.repository.js'
import type {
    analyzeObligationsQueryDTO,
    createObligationDTO,
    createObligationsBatchDTO,
    updateObligationDTO
} from './obligations.schema.js'

const historyValue = (value: Date | { toString(): string } | string | number | null) => {
    if (value instanceof Date) return value.toISOString()
    if (value !== null && typeof value === 'object') return value.toString()
    return value
}

const preventsDuplicate = (type: string) => !repeatableObligationTypes.some(
    repeatableType => repeatableType === type
)

class ObligationsService {
    async analyzeObligations(engagementId: string, query: analyzeObligationsQueryDTO) {
        const context = await obligationsRepository.findBenefitContext(engagementId)
        if (!context) {
            throw new AppError('Engagement not found', 404, 'ENGAGEMENT_NOT_FOUND')
        }

        const {
            startMonth,
            startYear,
            endMonth,
            endYear,
            calculateSalary,
            calculateVacation,
            calculateThirteenthSalary
        } = query

        return suggestBenefitObligations(
            context,
            { startMonth, startYear, endMonth, endYear },
            { calculateSalary, calculateVacation, calculateThirteenthSalary }
        )
    }

    async createObligationsBatch(engagementId: string, data: createObligationsBatchDTO) {
        const engagement = await obligationsRepository.findEngagementEmployeeId(engagementId)
        if (!engagement) {
            throw new AppError('Engagement not found', 404, 'ENGAGEMENT_NOT_FOUND')
        }

        const duplicateCandidates = data.obligations
            .filter(item =>
                !repeatableObligationTypes.some(type => type === item.type) &&
                item.referenceStart !== undefined && item.referenceStart !== null &&
                item.referenceEnd !== undefined && item.referenceEnd !== null
            )
            .map(item => ({
                type: item.type,
                referenceStart: item.referenceStart as Date,
                referenceEnd: item.referenceEnd as Date
            }))

        const seenPeriods = new Set<string>()
        for (const candidate of duplicateCandidates) {
            const start = candidate.referenceStart
            const end = candidate.referenceEnd
            const startMonth = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`
            const endMonth = `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, '0')}`
            const key = candidate.type === 'salario' || candidate.type === 'ferias'
                ? `${candidate.type}:${startMonth}:${endMonth}`
                : candidate.type === 'decimo_terceiro'
                    ? `${candidate.type}:${start.getUTCFullYear()}:${end.getUTCFullYear()}`
                    : `${candidate.type}:${start.getTime()}:${end.getTime()}`

            if (seenPeriods.has(key)) {
                throw new AppError(
                    'The batch contains duplicate obligations for the same reference period',
                    409,
                    'DUPLICATE_OBLIGATION'
                )
            }
            seenPeriods.add(key)
        }

        const result = await obligationsRepository.createObligationsBatch(
            engagementId,
            engagement.employeeId,
            data.obligations,
            duplicateCandidates
        )

        if (result.duplicate) {
            throw new AppError(
                'One or more obligations already exist for the selected reference periods',
                409,
                'DUPLICATE_OBLIGATION'
            )
        }

        return result.obligations
    }

    async createObligation(engagementId: string, data: createObligationDTO) {
        const engagement = await obligationsRepository.findEngagementEmployeeId(engagementId)
        if (!engagement) {
            throw new AppError('Engagement not found', 404, 'ENGAGEMENT_NOT_FOUND')
        }

        const result = await obligationsRepository.createObligation(
            engagementId,
            engagement.employeeId,
            data,
            preventsDuplicate(data.type)
        )

        if (result.duplicate) {
            throw new AppError(
                'An obligation of this type already exists for this reference period',
                409,
                'DUPLICATE_OBLIGATION'
            )
        }

        return result.obligation
    }

    async updateObligation(engagementId: string, obligationId: string, data: updateObligationDTO) {
        const existing = await obligationsRepository.findObligationById(engagementId, obligationId)
        if (!existing) {
            throw new AppError('Obligation not found for this engagement', 404, 'OBLIGATION_NOT_FOUND')
        }

        const changes: Record<string, { previous: string | number | null; current: string | number | null }> = {}
        for (const field of [
            'type', 'title', 'description', 'referenceStart', 'referenceEnd',
            'dueDate', 'originalValue', 'finalValue', 'status', 'observations'
        ] as const) {
            const nextValue = data[field]
            if (nextValue === undefined) continue

            const previousValue = existing[field]
            const normalizedPrevious = previousValue instanceof Date
                ? previousValue.getTime()
                : previousValue?.toString() ?? null
            const normalizedNext = nextValue instanceof Date
                ? nextValue.getTime()
                : nextValue?.toString() ?? null

            if (normalizedPrevious === normalizedNext) continue
            changes[field] = {
                previous: historyValue(previousValue),
                current: historyValue(nextValue)
            }
        }

        if (existing.allocations.length > 0 || existing.movements.length > 0) {
            const protectedFields = [
                'type', 'referenceStart', 'referenceEnd',
                'originalValue', 'finalValue', 'status'
            ]
            if (protectedFields.some(field => changes[field] !== undefined)) {
                throw new AppError(
                    'Cannot change financial or reference fields while the obligation has linked movements or allocations',
                    409,
                    'OBLIGATION_HAS_FINANCIAL_RECORDS'
                )
            }
        }

        if (Object.keys(changes).length === 0) {
            const { allocations, movements, ...obligation } = existing
            return {
                ...obligation,
                originalValue: Number(obligation.originalValue),
                finalValue: Number(obligation.finalValue)
            }
        }

        const nextStart = data.referenceStart !== undefined ? data.referenceStart : existing.referenceStart
        const nextEnd = data.referenceEnd !== undefined ? data.referenceEnd : existing.referenceEnd
        if (nextStart && nextEnd && nextEnd < nextStart) {
            throw new AppError('Reference end cannot be before reference start', 400, 'INVALID_OBLIGATION_PERIOD')
        }

        const engagement = await obligationsRepository.findEngagementEmployeeId(engagementId)
        if (!engagement) throw new AppError('Engagement not found', 404, 'ENGAGEMENT_NOT_FOUND')

        const nextType = data.type ?? existing.type
        const result = await obligationsRepository.updateObligation(
            engagementId,
            engagement.employeeId,
            obligationId,
            data,
            changes,
            preventsDuplicate(nextType) && (
                changes.type !== undefined ||
                changes.referenceStart !== undefined ||
                changes.referenceEnd !== undefined
            ),
            nextType,
            nextStart,
            nextEnd
        )

        if (result.duplicate) {
            throw new AppError(
                'An obligation of this type already exists for this reference period',
                409,
                'DUPLICATE_OBLIGATION'
            )
        }

        return result.obligation
    }

    async findObligationsByEngagement(engagementId: string) {
        const engagement = await obligationsRepository.findEngagementEmployeeId(engagementId)
        if (!engagement) {
            throw new AppError('Engagement not found', 404, 'ENGAGEMENT_NOT_FOUND')
        }
        return obligationsRepository.findObligationsByEngagement(engagementId)
    }

    async deleteObligation(engagementId: string, obligationId: string) {
        const existing = await obligationsRepository.findObligationById(engagementId, obligationId)
        if (!existing) {
            throw new AppError('Obligation not found for this engagement', 404, 'OBLIGATION_NOT_FOUND')
        }

        if (existing.allocations.length > 0 || existing.movements.length > 0) {
            throw new AppError(
                'Cannot delete an obligation with linked movements or payment allocations',
                409,
                'OBLIGATION_HAS_FINANCIAL_RECORDS'
            )
        }

        const engagement = await obligationsRepository.findEngagementEmployeeId(engagementId)
        if (!engagement) throw new AppError('Engagement not found', 404, 'ENGAGEMENT_NOT_FOUND')

        await obligationsRepository.deleteObligation(
            engagementId,
            engagement.employeeId,
            obligationId,
            {
                type: existing.type,
                title: existing.title,
                description: existing.description,
                referenceStart: historyValue(existing.referenceStart),
                referenceEnd: historyValue(existing.referenceEnd),
                dueDate: historyValue(existing.dueDate),
                originalValue: existing.originalValue.toString(),
                finalValue: existing.finalValue.toString(),
                status: existing.status,
                observations: existing.observations
            }
        )

        return true
    }
}
export default new ObligationsService()
