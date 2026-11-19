import { AppError } from '../../../shared/errors/AppError.js'
import { PaymentAllocationError } from '../allocations/paymentAllocation.js'
import movementsRepository from './movements.repository.js'
import type {
    createMovementDTO,
    createPaymentDTO,
    findMovementsQueryDTO,
    updateMovementDTO,
    updatePaymentDTO
} from './movements.schema.js'

class MovementsService {
    private async ensureEngagement(engagementId: string) {
        const engagement = await movementsRepository.findEngagementEmployeeId(engagementId)
        if (!engagement) {
            throw new AppError('Engagement not found', 404, 'ENGAGEMENT_NOT_FOUND')
        }
        return engagement
    }

    private handleAllocationError(error: unknown): never {
        if (error instanceof PaymentAllocationError) {
            if (error.code === 'INVALID_ALLOCATION_OBLIGATION') {
                throw new AppError(
                    'One or more selected obligations are not available for allocation',
                    409,
                    error.code
                )
            }

            if (error.code === 'ALLOCATION_EXCEEDS_OUTSTANDING_VALUE') {
                throw new AppError(
                    'Allocation value cannot exceed the obligation outstanding value',
                    409,
                    error.code
                )
            }

            throw new AppError(
                'Total allocations cannot exceed the payment value',
                400,
                error.code
            )
        }
        throw error
    }

    async createMovement(engagementId: string, data: createMovementDTO) {
        await this.ensureEngagement(engagementId)
        const result = await movementsRepository.createMovement(engagementId, data)

        if (!result) {
            throw new AppError('Engagement not found', 404, 'ENGAGEMENT_NOT_FOUND')
        }
        if ('invalidObligation' in result) {
            throw new AppError('Obligation not found for this engagement', 404, 'OBLIGATION_NOT_FOUND')
        }

        return result
    }

    async createPayment(engagementId: string, data: createPaymentDTO) {
        await this.ensureEngagement(engagementId)

        try {
            const result = await movementsRepository.createPayment(engagementId, data)

            if (!result) {
                throw new AppError('Engagement not found', 404, 'ENGAGEMENT_NOT_FOUND')
            }
            if ('categoryNotFound' in result) {
                throw new AppError('Financial category not found', 404, 'CATEGORY_NOT_FOUND')
            }
            if ('categoryInactive' in result) {
                throw new AppError('Cannot register a payment with an inactive category', 400, 'CATEGORY_INACTIVE')
            }
            if ('invalidCategoryType' in result) {
                throw new AppError('Employee payments require an expense category', 400, 'INVALID_CATEGORY_TYPE')
            }

            return result
        } catch (error) {
            this.handleAllocationError(error)
        }
    }

    async updateMovement(
        engagementId: string,
        movementId: string,
        data: updateMovementDTO
    ) {
        await this.ensureEngagement(engagementId)
        const result = await movementsRepository.updateMovement(engagementId, movementId, data)

        if (!result) {
            throw new AppError('Movement not found for this engagement', 404, 'MOVEMENT_NOT_FOUND')
        }
        if ('paymentRequiresPaymentFlow' in result) {
            throw new AppError('Payment movements must be updated through the payment endpoint', 409, 'PAYMENT_REQUIRES_PAYMENT_FLOW')
        }
        if ('invalidObligation' in result) {
            throw new AppError('Obligation not found for this engagement', 404, 'OBLIGATION_NOT_FOUND')
        }
        if ('invalidPeriod' in result) {
            throw new AppError('Reference end cannot be before reference start', 400, 'INVALID_MOVEMENT_PERIOD')
        }

        return result
    }

    async updatePayment(
        engagementId: string,
        movementId: string,
        data: updatePaymentDTO
    ) {
        await this.ensureEngagement(engagementId)

        try {
            const result = await movementsRepository.updatePayment(engagementId, movementId, data)

            if (!result) {
                throw new AppError('Payment not found for this engagement', 404, 'PAYMENT_NOT_FOUND')
            }
            if ('missingFinancialTransaction' in result) {
                throw new AppError('Payment is missing its financial transaction', 409, 'PAYMENT_TRANSACTION_NOT_FOUND')
            }
            if ('categoryNotFound' in result) {
                throw new AppError('Financial category not found', 404, 'CATEGORY_NOT_FOUND')
            }
            if ('categoryInactive' in result) {
                throw new AppError('Cannot assign an inactive category to a payment', 400, 'CATEGORY_INACTIVE')
            }
            if ('invalidCategoryType' in result) {
                throw new AppError('Employee payments require an expense category', 400, 'INVALID_CATEGORY_TYPE')
            }

            return result
        } catch (error) {
            this.handleAllocationError(error)
        }
    }

    async deleteMovement(engagementId: string, movementId: string) {
        await this.ensureEngagement(engagementId)
        const result = await movementsRepository.deleteMovement(engagementId, movementId)

        if (!result) {
            throw new AppError('Movement not found for this engagement', 404, 'MOVEMENT_NOT_FOUND')
        }
        if (typeof result === 'object' && 'missingFinancialTransaction' in result) {
            throw new AppError('Payment is missing its financial transaction', 409, 'PAYMENT_TRANSACTION_NOT_FOUND')
        }

        return true
    }

    async findMovementsByEngagement(engagementId: string, filters: findMovementsQueryDTO) {
        await this.ensureEngagement(engagementId)
        return movementsRepository.findMovementsByEngagement(engagementId, filters)
    }

    async findOpenObligations(engagementId: string) {
        await this.ensureEngagement(engagementId)
        return movementsRepository.findOpenObligations(engagementId)
    }

    async findMovementById(engagementId: string, movementId: string) {
        await this.ensureEngagement(engagementId)
        const movement = await movementsRepository.findMovementById(engagementId, movementId)
        if (!movement) {
            throw new AppError('Movement not found for this engagement', 404, 'MOVEMENT_NOT_FOUND')
        }
        return movement
    }
}

export default new MovementsService()
