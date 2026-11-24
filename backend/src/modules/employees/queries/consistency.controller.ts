import type { Request, Response } from 'express'
import { AppError } from '../../../shared/errors/AppError.js'
import consistencyService from './consistency.service.js'

class EmployeesConsistencyController {
    async analyzeEmployee(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')

        const analysis = await consistencyService.analyzeEmployee(req.params.employeeId as string)
        return res.status(200).json({
            message: 'Employee financial consistency analyzed successfully',
            data: analysis
        })
    }
}

export default new EmployeesConsistencyController()
