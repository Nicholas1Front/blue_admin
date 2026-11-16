import { AppError } from '../../../shared/errors/AppError.js'
import { removeUndefined } from '../../../shared/helpers/objects/removeUndefined.js'
import engagementsRepository from './engagements.repository.js'
import type { createEngagementDTO, updateEngagementDTO, findEngagementsByFiltersDTO } from './engagements.dto.js'

const validateEngagementPeriod = (entryDate: Date | null, exitDate: Date | null) => {
    if (entryDate && exitDate && exitDate < entryDate) {
        throw new AppError('Exit date cannot be before entry date', 400, 'INVALID_ENGAGEMENT_PERIOD')
    }
}

const historyValue = (value: Date | { toString(): string } | string | null) => {
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
        const cleanedData = removeUndefined(updateData)
        const entryDate = cleanedData.entryDate !== undefined ? cleanedData.entryDate : existingEngagement.entryDate
        const exitDate = cleanedData.exitDate !== undefined ? cleanedData.exitDate : existingEngagement.exitDate
        validateEngagementPeriod(entryDate, exitDate)

        const changes: Record<string, { previous: string | number | null; current: string | number | null }> = {}
        const fields = ['entryDate', 'exitDate', 'status', 'currentSalary', 'hourlyRate', 'modality', 'observations'] as const

        for (const field of fields) {
            const nextValue = cleanedData[field]
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

        if (Object.keys(changes).length === 0) return existingEngagement

        const salaryChanged = Object.hasOwn(changes, 'currentSalary')
        return engagementsRepository.updateEngagement(
            employeeId,
            engagementId,
            cleanedData,
            changes,
            effectiveDate ?? new Date(),
            salaryChanged
        )
    }

    async findEngagementsByEmployee(employeeId: string, filters: findEngagementsByFiltersDTO) {
        const employeeExists = await engagementsRepository.employeeExists(employeeId)
        if (!employeeExists) throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND')

        return engagementsRepository.findEngagementsByEmployee(employeeId, removeUndefined(filters))
    }
}

export default new EngagementsService()
