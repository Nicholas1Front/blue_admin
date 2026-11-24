import { AppError } from '../../../shared/errors/AppError.js'
import movementsRepository from './movements.repository.js'
import type {
    createMovementDTO, createPaymentDTO, findMovementsQueryDTO, findMovementsByFiltersDTO,
    updateMovementDTO, updatePaymentDTO
} from './movements.schema.js'

class MovementsService {
    private async ensureEngagement(engagementId: string) {
        const engagement = await movementsRepository.findEngagementEmployeeId(engagementId)
        if (!engagement) throw new AppError('Engagement not found', 404, 'ENGAGEMENT_NOT_FOUND')
    }

    private handlePaymentError(result: Record<string, unknown>) {
        if ('categoryNotFound' in result) throw new AppError('Financial category not found', 404, 'CATEGORY_NOT_FOUND')
        if ('financialTransactionNotFound' in result) throw new AppError('Financial transaction not found', 404, 'TRANSACTION_NOT_FOUND')
        if ('transactionManagedSeparately' in result) throw new AppError('Update the shared financial transaction through the financial module', 409, 'TRANSACTION_MANAGED_SEPARATELY')
        if ('categoryInactive' in result) throw new AppError('Cannot register a payment with an inactive category', 400, 'CATEGORY_INACTIVE')
        if ('invalidCategoryType' in result) throw new AppError('Employee payments require an expense transaction', 400, 'INVALID_CATEGORY_TYPE')
        if ('transactionLinkedToOtherOrigin' in result) throw new AppError('Financial transaction is already linked to another origin', 409, 'TRANSACTION_LINKED_TO_OTHER_ORIGIN')
        if ('financialTransactionExceeded' in result) throw new AppError('Linked employee movements cannot exceed the financial transaction value', 409, 'FINANCIAL_TRANSACTION_VALUE_EXCEEDED')
        if ('missingObligation' in result) throw new AppError('This movement type requires an obligation', 400, 'OBLIGATION_REQUIRED')
        if ('invalidObligation' in result) throw new AppError('Obligation not found for this engagement', 404, 'OBLIGATION_NOT_FOUND')
    }

    async createMovement(engagementId: string, data: createMovementDTO) {
        await this.ensureEngagement(engagementId)
        const result = await movementsRepository.createMovement(engagementId, data)
        if (!result) throw new AppError('Engagement not found', 404, 'ENGAGEMENT_NOT_FOUND')
        if ('missingObligation' in result) throw new AppError('This movement type requires an obligation', 400, 'OBLIGATION_REQUIRED')
        if ('invalidObligation' in result) throw new AppError('Obligation not found for this engagement', 404, 'OBLIGATION_NOT_FOUND')
        return result
    }

    async createPayment(engagementId: string, data: createPaymentDTO) {
        await this.ensureEngagement(engagementId)
        const result = await movementsRepository.createPayment(engagementId, data)
        if (!result) throw new AppError('Engagement not found', 404, 'ENGAGEMENT_NOT_FOUND')
        this.handlePaymentError(result as Record<string, unknown>)
        return result
    }

    async updateMovement(engagementId: string, movementId: string, data: updateMovementDTO) {
        await this.ensureEngagement(engagementId)
        const result = await movementsRepository.updateMovement(engagementId, movementId, data)
        if (!result) throw new AppError('Movement not found for this engagement', 404, 'MOVEMENT_NOT_FOUND')
        if ('paymentRequiresPaymentFlow' in result) throw new AppError('Payment movements must be updated through the payment endpoint', 409, 'PAYMENT_REQUIRES_PAYMENT_FLOW')
        if ('missingObligation' in result) throw new AppError('This movement type requires an obligation', 400, 'OBLIGATION_REQUIRED')
        if ('invalidObligation' in result) throw new AppError('Obligation not found for this engagement', 404, 'OBLIGATION_NOT_FOUND')
        if ('invalidPeriod' in result) throw new AppError('Reference end cannot be before reference start', 400, 'INVALID_MOVEMENT_PERIOD')
        return result
    }

    async updatePayment(engagementId: string, movementId: string, data: updatePaymentDTO) {
        await this.ensureEngagement(engagementId)
        const result = await movementsRepository.updatePayment(engagementId, movementId, data)
        if (!result) throw new AppError('Payment not found for this engagement', 404, 'PAYMENT_NOT_FOUND')
        this.handlePaymentError(result as Record<string, unknown>)
        return result
    }

    async deleteMovement(engagementId: string, movementId: string) {
        await this.ensureEngagement(engagementId)
        const result = await movementsRepository.deleteMovement(engagementId, movementId)
        if (!result) throw new AppError('Movement not found for this engagement', 404, 'MOVEMENT_NOT_FOUND')
        return true
    }

    async findMovementsByFilters(filters: findMovementsByFiltersDTO) {
        const result = await movementsRepository.findMovementsByFilters(filters)
        if ('invalidCursor' in result) {
            throw new AppError('Pagination cursor does not match the movement filters', 400, 'INVALID_CURSOR')
        }
        return result
    }

    async findMovementsByEngagement(engagementId: string, filters: findMovementsQueryDTO) {
        await this.ensureEngagement(engagementId)
        return movementsRepository.findMovementsByEngagement(engagementId, filters)
    }

    async findMovementById(engagementId: string, movementId: string) {
        await this.ensureEngagement(engagementId)
        const movement = await movementsRepository.findMovementById(engagementId, movementId)
        if (!movement) throw new AppError('Movement not found for this engagement', 404, 'MOVEMENT_NOT_FOUND')
        return movement
    }
}

export default new MovementsService()
