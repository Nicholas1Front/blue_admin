import { AppError } from '../../../../shared/errors/AppError.js'
import consistencyRepository from '../repositories/consistency.repository.js'

class EmployeesConsistencyService {
    async analyzeEmployee(employeeId: string) {
        const analysis = await consistencyRepository.analyzeEmployee(employeeId)
        if (!analysis) throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND')
        return analysis
    }
}

export default new EmployeesConsistencyService()
