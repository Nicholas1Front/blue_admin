import { AppError } from '../../../shared/errors/AppError.js'
import engagementsRepository from './engagements.repository.js'
import type { createEngagementDTO, findEngagementsByFiltersDTO, updateEngagementDTO } from './engagements.schema.js'

const validateEngagementPeriod = (entryDate: Date | null, exitDate: Date | null) => {
    if (entryDate && exitDate && exitDate < entryDate) {
        throw new AppError('Exit date cannot be before entry date', 400, 'INVALID_ENGAGEMENT_PERIOD')
    }
}

const historyValue = (value: Date | { toString(): string } | string | number | null) => {
    if (value instanceof Date) return value.toISOString()
    if (value !== null && typeof value === 'object') return value.toString()
    return value
}

class EngagementsService {
    async createEngagement(employeeId: string, data: createEngagementDTO) {
        const employeeExists = await engagementsRepository.employeeExists(employeeId)
        if (!employeeExists) throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND')

        validateEngagementPeriod(data.entryDate ?? null, data.exitDate ?? null)
        return engagementsRepository.createEngagement(employeeId, data)
    }

    async updateEngagement(employeeId: string, engagementId: string, data: updateEngagementDTO) {
        const existingEngagement = await engagementsRepository.findEngagementById(employeeId, engagementId)
        if (!existingEngagement) {
            throw new AppError('Engagement not found for this employee', 404, 'ENGAGEMENT_NOT_FOUND')
        }

        const { effectiveDate, ...updateData } = data
        const entryDate = updateData.entryDate !== undefined ? updateData.entryDate : existingEngagement.entryDate
        const exitDate = updateData.exitDate !== undefined ? updateData.exitDate : existingEngagement.exitDate
        validateEngagementPeriod(entryDate, exitDate)

        const changes: Record<string, { previous: string | number | null; current: string | number | null }> = {}
        const fields = ['entryDate', 'exitDate', 'status', 'currentSalary', 'hourlyRate', 'modality', 'observations'] as const

        for (const field of fields) {
            const nextValue = updateData[field]
            if (nextValue === undefined) continue

            const previousValue = existingEngagement[field]
            const normalizedPrevious = previousValue instanceof Date ? previousValue.getTime() : previousValue?.toString() ?? null
            const normalizedNext = nextValue instanceof Date ? nextValue.getTime() : nextValue?.toString() ?? null
            if (normalizedPrevious === normalizedNext) continue

            changes[field] = {
                previous: historyValue(previousValue),
                current: historyValue(nextValue)
            }
        }

        if (Object.keys(changes).length === 0) return { engagement: existingEngagement, history: null }

        const salaryChanged = Object.hasOwn(changes, 'currentSalary')
        return engagementsRepository.updateEngagement(
            employeeId,
            engagementId,
            updateData,
            changes,
            effectiveDate ?? new Date(),
            salaryChanged
        )
    }

    async findEngagementsByFilters(filters: findEngagementsByFiltersDTO) {
        const result = await engagementsRepository.findEngagementsByFilters(filters)
        if ('invalidCursor' in result) {
            throw new AppError('Pagination cursor does not match the engagement filters', 400, 'INVALID_CURSOR')
        }
        return result
    }

    async findEngagementsByEmployee(employeeId: string) {
        const employeeExists = await engagementsRepository.employeeExists(employeeId)
        if (!employeeExists) throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND')

        return engagementsRepository.findEngagementsByEmployee(employeeId)
    }
}

export default new EngagementsService()
