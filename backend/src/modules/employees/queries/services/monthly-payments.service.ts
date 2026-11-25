import { AppError } from '../../../../shared/errors/AppError.js'
import monthlyPaymentsRepository from '../repositories/monthly-payments.repository.js'
import type { monthlyPaymentsQueryDTO } from '../queries.schema.js'

class MonthlyPaymentsService {
    async findMonthlyPayments(query: monthlyPaymentsQueryDTO) {
        const result = await monthlyPaymentsRepository.findMonthlyPayments(query)
        if ('invalidCursor' in result) {
            throw new AppError('Pagination cursor does not match the monthly payment filters', 400, 'INVALID_CURSOR')
        }
        return result
    }
}

export default new MonthlyPaymentsService()
