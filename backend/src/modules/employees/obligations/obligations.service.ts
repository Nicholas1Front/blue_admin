import { AppError } from '../../../shared/errors/AppError.js'
import { repeatableObligationTypes } from '../shareds/repeatableObligationTypes.js'
import obligationsRepository from './obligations.repository.js'
import type { createObligationDTO, updateObligationDTO } from './obligations.schema.js'

const historyValue = (value: Date | { toString(): string } | string | number | null) => {
    if (value instanceof Date) return value.toISOString()
    if (value !== null && typeof value === 'object') return value.toString()
    return value
}

const preventsDuplicate = (type: string) => !repeatableObligationTypes.some(
    repeatableType => repeatableType === type
)

class ObligationsService {
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

        if (existing.allocations.length > 0 || existing.movements.length > 0) {
            const protectedFields = [
                'type', 'referenceStart', 'referenceEnd',
                'originalValue', 'finalValue', 'status'
            ]
            if (protectedFields.some(field => Object.hasOwn(data, field))) {
                throw new AppError(
                    'Cannot change financial or reference fields while the obligation has linked movements or allocations',
                    409,
                    'OBLIGATION_HAS_FINANCIAL_RECORDS'
                )
            }
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
            preventsDuplicate(nextType)
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
                referenceStart: historyValue(existing.referenceStart),
                referenceEnd: historyValue(existing.referenceEnd),
                originalValue: existing.originalValue.toString(),
                finalValue: existing.finalValue.toString(),
                status: existing.status
            }
        )

        return true
    }
}

export default new ObligationsService()
